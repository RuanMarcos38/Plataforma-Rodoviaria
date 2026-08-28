const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { createSeedData } = require("../../packages/domain/seed-data");
const { STATUS_LABELS, ALLOWED_TRANSITIONS, nextStatuses, assertTransition } = require("../../packages/domain/status-machine");
const { ROLES, assertPermission } = require("../../packages/domain/rbac");
const { estimateFreightCost, matchDrivers, computeDashboard } = require("../../packages/domain/calculations");

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "tenant-rodonorte";
const ROOT = path.resolve(__dirname, "..", "..");
const WEB_ROOT = path.join(ROOT, "apps", "web");
const ASSET_ROOT = path.join(ROOT, "assets");
const data = createSeedData();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

function currentTenant(request) {
  const tenantId = request.headers["x-tenant-id"] || DEFAULT_TENANT_ID;
  return data.tenants.find((tenant) => tenant.id === tenantId) || data.tenants[0];
}

function currentRole(request) {
  return request.headers["x-role"] || "CARRIER_MANAGER";
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendError(response, status, message, details) {
  sendJson(response, status, {
    error: message,
    details: details || null
  });
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Corpo da requisicao excede o limite"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("JSON invalido"));
      }
    });
    request.on("error", reject);
  });
}

function resolveStaticPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);

  if (decodedPath === "/" || decodedPath === "/index.html") {
    return { filePath: path.join(WEB_ROOT, "index.html"), root: WEB_ROOT };
  }

  if (decodedPath.startsWith("/assets/")) {
    const requestedAsset = decodedPath.replace(/^\/assets\//, "");
    return { filePath: path.join(ASSET_ROOT, requestedAsset), root: ASSET_ROOT };
  }

  return { filePath: path.join(WEB_ROOT, decodedPath), root: WEB_ROOT };
}

function serveStatic(request, response, urlPath) {
  const { filePath, root } = resolveStaticPath(urlPath);
  const normalized = path.normalize(filePath);

  if (!normalized.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(normalized, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const mimeType = MIME_TYPES[path.extname(normalized)] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": mimeType,
      "Cache-Control": "no-store"
    });
    response.end(content);
  });
}

function requireTenantEntity(response, tenantId, entity, entityName) {
  if (!entity || entity.tenantId !== tenantId) {
    sendError(response, 404, `${entityName} nao encontrado para este tenant`);
    return false;
  }
  return true;
}

function idempotent(request, key, producer) {
  const headerKey = request.headers["idempotency-key"];
  const finalKey = headerKey || key;
  if (!finalKey) return producer();
  if (data.idempotency.has(finalKey)) return data.idempotency.get(finalKey);
  const result = producer();
  data.idempotency.set(finalKey, result);
  return result;
}

function audit(tenantId, actor, action, entity) {
  data.auditLog.unshift({
    id: `AUD-${String(data.auditLog.length + 1).padStart(3, "0")}`,
    tenantId,
    actor,
    action,
    entity,
    at: new Date().toISOString()
  });
}

function listFreights(tenantId, searchParams) {
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const status = searchParams.get("status") || "all";
  const priority = searchParams.get("priority") || "all";

  return data.freights.filter((freight) => {
    if (freight.tenantId !== tenantId) return false;
    if (status !== "all" && freight.status !== status) return false;
    if (priority !== "all" && freight.priority !== priority) return false;
    if (!query) return true;

    return [
      freight.id,
      freight.shipper,
      freight.origin.city,
      freight.origin.uf,
      freight.destination.city,
      freight.destination.uf,
      freight.cargo,
      freight.requiredVehicle,
      freight.requiredBody
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function validateFreight(payload) {
  const required = ["shipper", "originCity", "originUf", "destinationCity", "destinationUf", "cargo", "weightKg", "cargoValue"];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) {
    throw new Error(`Campos obrigatorios ausentes: ${missing.join(", ")}`);
  }
}

function createFreight(tenantId, payload) {
  validateFreight(payload);

  const distanceKm = Number(payload.distanceKm || 420);
  const tolls = Number(payload.tolls || 280);
  const cargoValue = Number(payload.cargoValue);
  const axles = Number(payload.axles || 4);

  const freight = {
    id: `FRT-${new Date().getFullYear()}-${String(data.freights.length + 1).padStart(3, "0")}`,
    tenantId,
    shipper: payload.shipper,
    origin: {
      city: payload.originCity,
      uf: payload.originUf.toUpperCase(),
      lat: Number(payload.originLat || 0),
      lng: Number(payload.originLng || 0)
    },
    destination: {
      city: payload.destinationCity,
      uf: payload.destinationUf.toUpperCase(),
      lat: Number(payload.destinationLat || 0),
      lng: Number(payload.destinationLng || 0)
    },
    cargo: payload.cargo,
    weightKg: Number(payload.weightKg),
    volumeM3: Number(payload.volumeM3 || 0),
    cargoValue,
    requiredVehicle: payload.requiredVehicle || "truck",
    requiredBody: payload.requiredBody || "bau",
    axles,
    distanceKm,
    tolls,
    pickupWindow: payload.pickupWindow || "A definir",
    deliveryEta: payload.deliveryEta || "A calcular",
    status: "PUBLISHED",
    riskScore: Number(payload.riskScore || 32),
    priority: payload.priority || "media",
    returnOpportunity: Boolean(payload.returnOpportunity),
    price: Number(payload.price || estimateFreightCost({ distanceKm, tolls, cargoValue, axles }).suggestedPrice),
    requirements: payload.requirements || ["RNTRC ativo", "Documentos validos", "Rastreamento"]
  };

  freight.estimate = estimateFreightCost({
    distanceKm: freight.distanceKm,
    tolls: freight.tolls,
    cargoValue: freight.cargoValue,
    axles: freight.axles
  });

  data.freights.unshift(freight);
  audit(tenantId, "carrier-manager", "freight:create", freight.id);
  return freight;
}

function createOffer(request, tenantId, payload) {
  const freight = data.freights.find((item) => item.id === payload.freightId);
  const driver = data.drivers.find((item) => item.id === payload.driverId);
  if (!freight || freight.tenantId !== tenantId) {
    throw new Error("Frete nao encontrado");
  }
  if (!driver || driver.tenantId !== tenantId) {
    throw new Error("Motorista nao encontrado");
  }

  return idempotent(request, payload.idempotencyKey, () => {
    const offer = {
      id: `OFR-${String(data.offers.length + 1).padStart(4, "0")}`,
      tenantId,
      freightId: freight.id,
      driverId: driver.id,
      driverName: driver.name,
      amount: Number(payload.amount || freight.price),
      status: "sent",
      message: payload.message || "Proposta enviada pela torre de controle",
      createdAt: new Date().toISOString()
    };

    data.offers.unshift(offer);
    if (["PUBLISHED", "MATCHING"].includes(freight.status)) {
      freight.status = "NEGOTIATING";
    }
    audit(tenantId, driver.name, "offer:create", offer.id);
    return offer;
  });
}

function createContract(request, tenantId, payload) {
  const offer = data.offers.find((item) => item.id === payload.offerId);
  if (!offer || offer.tenantId !== tenantId) {
    throw new Error("Proposta nao encontrada");
  }

  return idempotent(request, payload.idempotencyKey, () => {
    const freight = data.freights.find((item) => item.id === offer.freightId);
    const driver = data.drivers.find((item) => item.id === offer.driverId);
    freight.status = "ACCEPTED";

    const trip = {
      id: `TRP-${String(9000 + data.trips.length + 1)}`,
      tenantId,
      freightId: freight.id,
      driverId: driver.id,
      status: "DOCUMENTATION",
      vehiclePlate: driver.vehiclePlate,
      route: `${freight.origin.city}/${freight.origin.uf} -> ${freight.destination.city}/${freight.destination.uf}`,
      eta: freight.deliveryEta,
      progress: 12,
      alerts: [{ type: "document", text: "Preparar CIOT, CT-e e MDF-e em homologacao" }],
      timeline: [
        { at: "agora", status: "ACCEPTED", text: "Proposta aceita" },
        { at: "agora", status: "DOCUMENTATION", text: "Fluxo documental iniciado" }
      ],
      lastPing: { city: freight.origin.city, uf: freight.origin.uf, speed: 0, at: "agora" }
    };

    data.trips.unshift(trip);
    offer.status = "accepted";
    audit(tenantId, "carrier-manager", "contract:create", trip.id);
    return trip;
  });
}

async function handleApi(request, response, url) {
  const tenant = currentTenant(request);
  const role = currentRole(request);
  const tenantId = tenant.id;

  try {
    if (url.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "plataforma-rodoviaria-api",
        environment: process.env.APP_ENV || "development"
      });
    }

    if (url.pathname === "/api/bootstrap") {
      return sendJson(response, 200, {
        tenant,
        tenants: data.tenants,
        roles: ROLES,
        statusLabels: STATUS_LABELS,
        transitions: ALLOWED_TRANSITIONS,
        brand: tenant.brand,
        generatedAt: new Date().toISOString()
      });
    }

    if (url.pathname === "/api/dashboard") {
      assertPermission(role, "dashboard:read");
      return sendJson(response, 200, computeDashboard(tenantId, data));
    }

    if (url.pathname === "/api/freights" && request.method === "GET") {
      assertPermission(role, "freight:read");
      return sendJson(response, 200, listFreights(tenantId, url.searchParams));
    }

    if (url.pathname === "/api/freights" && request.method === "POST") {
      assertPermission(role, "freight:create");
      const payload = await readBody(request);
      const freight = idempotent(request, payload.idempotencyKey, () => createFreight(tenantId, payload));
      return sendJson(response, 201, freight);
    }

    if (url.pathname === "/api/drivers" && request.method === "GET") {
      assertPermission(role, "driver:read");
      const freightId = url.searchParams.get("freightId");
      const freight = data.freights.find((item) => item.id === freightId && item.tenantId === tenantId);
      const drivers = data.drivers.filter((driver) => driver.tenantId === tenantId);
      return sendJson(response, 200, freight ? matchDrivers(freight, drivers) : drivers);
    }

    if (url.pathname === "/api/offers" && request.method === "POST") {
      assertPermission(role, "freight:negotiate");
      const payload = await readBody(request);
      return sendJson(response, 201, createOffer(request, tenantId, payload));
    }

    if (url.pathname === "/api/contracts" && request.method === "POST") {
      assertPermission(role, "freight:negotiate");
      const payload = await readBody(request);
      return sendJson(response, 201, createContract(request, tenantId, payload));
    }

    if (url.pathname === "/api/trips" && request.method === "GET") {
      assertPermission(role, "trip:read");
      return sendJson(response, 200, data.trips.filter((trip) => trip.tenantId === tenantId));
    }

    const tripAdvanceMatch = url.pathname.match(/^\/api\/trips\/([^/]+)\/advance$/);
    if (tripAdvanceMatch && request.method === "POST") {
      assertPermission(role, "trip:advance");
      const payload = await readBody(request);
      const trip = data.trips.find((item) => item.id === tripAdvanceMatch[1]);
      if (!requireTenantEntity(response, tenantId, trip, "Viagem")) return;

      const result = idempotent(request, payload.idempotencyKey, () => {
        assertTransition(trip.status, payload.targetStatus);
        trip.status = payload.targetStatus;
        trip.progress = Math.min(100, Number(payload.progress || trip.progress + 12));
        trip.timeline.push({
          at: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          status: payload.targetStatus,
          text: payload.note || STATUS_LABELS[payload.targetStatus] || payload.targetStatus
        });
        audit(tenantId, role, "trip:advance", trip.id);
        return trip;
      });

      return sendJson(response, 200, result);
    }

    if (url.pathname === "/api/fiscal" && request.method === "GET") {
      assertPermission(role, "fiscal:read");
      return sendJson(response, 200, data.fiscalDocuments.filter((doc) => doc.tenantId === tenantId));
    }

    if (url.pathname === "/api/finance" && request.method === "GET") {
      assertPermission(role, "finance:read");
      return sendJson(response, 200, data.payments.filter((payment) => payment.tenantId === tenantId));
    }

    if (url.pathname === "/api/risk" && request.method === "GET") {
      assertPermission(role, "dashboard:read");
      const checks = data.drivers
        .filter((driver) => driver.tenantId === tenantId)
        .map((driver) => ({
          id: `RSK-${driver.id}`,
          driverId: driver.id,
          driverName: driver.name,
          score: driver.riskScore,
          level: driver.riskScore >= 50 ? "medio" : "baixo",
          findings: [
            driver.documentsStatus === "valid" ? "Documentos validos" : "Documentos em revisao",
            driver.rntrcStatus === "active" ? "RNTRC ativo" : "RNTRC pendente",
            driver.available ? "Disponivel" : "Em viagem"
          ]
        }));
      return sendJson(response, 200, checks);
    }

    if (url.pathname === "/api/incidents" && request.method === "POST") {
      assertPermission(role, "incident:create");
      const payload = await readBody(request);
      const incident = {
        id: `INC-${String(data.incidents.length + 1).padStart(4, "0")}`,
        tenantId,
        tripId: payload.tripId,
        type: payload.type || "operacional",
        severity: payload.severity || "alta",
        message: payload.message || "Ocorrencia registrada pela torre",
        createdAt: new Date().toISOString()
      };

      data.incidents.unshift(incident);
      const trip = data.trips.find((item) => item.id === payload.tripId && item.tenantId === tenantId);
      if (trip && trip.status !== "CLOSED") {
        trip.alerts.unshift({ type: "incident", text: incident.message });
        if (nextStatuses(trip.status).includes("INCIDENT")) {
          trip.status = "INCIDENT";
        }
      }
      audit(tenantId, role, "incident:create", incident.id);
      return sendJson(response, 201, incident);
    }

    if (url.pathname === "/api/brand" && request.method === "POST") {
      assertPermission(role, "brand:update");
      const payload = await readBody(request);
      tenant.brand = {
        ...tenant.brand,
        appName: payload.appName || tenant.brand.appName,
        primaryColor: payload.primaryColor || tenant.brand.primaryColor,
        accentColor: payload.accentColor || tenant.brand.accentColor
      };
      audit(tenantId, role, "brand:update", tenant.id);
      return sendJson(response, 200, tenant.brand);
    }

    if (url.pathname === "/api/audit" && request.method === "GET") {
      assertPermission(role, "dashboard:read");
      return sendJson(response, 200, data.auditLog.filter((item) => item.tenantId === tenantId).slice(0, 25));
    }

    return sendError(response, 404, "Rota nao encontrada");
  } catch (error) {
    return sendError(response, error.message.includes("permissao") ? 403 : 400, error.message);
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    return handleApi(request, response, url);
  }

  return serveStatic(request, response, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Plataforma Rodoviaria rodando em http://localhost:${PORT}`);
});
