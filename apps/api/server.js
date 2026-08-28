const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { createSeedData } = require("../../packages/domain/seed-data");
const { createFileStore } = require("../../packages/domain/store");
const { STATUS_LABELS, ALLOWED_TRANSITIONS, nextStatuses, assertTransition } = require("../../packages/domain/status-machine");
const { ROLES, hasPermission, assertPermission } = require("../../packages/domain/rbac");
const { estimateFreightCost, matchDrivers, computeDashboard } = require("../../packages/domain/calculations");

const ROOT = path.resolve(__dirname, "..", "..");
loadEnvFile(path.join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 3000);
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "tenant-rodonorte";
const WEB_ROOT = path.join(ROOT, "apps", "web");
const ASSET_ROOT = path.join(ROOT, "assets");
const configuredStoreFile = process.env.DATA_FILE || path.join(ROOT, "data", "dev-store.json");
const STORE_FILE = path.isAbsolute(configuredStoreFile) ? configuredStoreFile : path.join(ROOT, configuredStoreFile);
const store = createFileStore(STORE_FILE, createSeedData);
const data = store.data;

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

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const rows = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  rows.forEach((row) => {
    const trimmed = row.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").trim();
    }
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeNow() {
  return new Date().toISOString();
}

function displayTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function currentTenant(request) {
  const tenantId = request.headers["x-tenant-id"] || DEFAULT_TENANT_ID;
  return data.tenants.find((tenant) => tenant.id === tenantId) || data.tenants[0];
}

function currentRole(request) {
  return request.headers["x-role"] || "CARRIER_MANAGER";
}

function securityHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    ...extra
  };
}

function sendJson(response, status, payload) {
  response.writeHead(status, securityHeaders({ "Content-Type": "application/json; charset=utf-8" }));
  response.end(JSON.stringify(payload, null, 2));
}

function sendEmpty(response, status = 204) {
  response.writeHead(status, securityHeaders());
  response.end();
}

function sendError(response, status, message, details) {
  sendJson(response, status, {
    error: message,
    details: details || null
  });
}

function persist() {
  store.save();
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
    response.writeHead(403, securityHeaders());
    response.end("Forbidden");
    return;
  }

  fs.readFile(normalized, (error, content) => {
    if (error) {
      response.writeHead(404, securityHeaders());
      response.end("Not found");
      return;
    }

    const mimeType = MIME_TYPES[path.extname(normalized)] || "application/octet-stream";
    response.writeHead(200, securityHeaders({ "Content-Type": mimeType }));
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

function assertAnyPermission(role, permissions) {
  if (!permissions.some((permission) => hasPermission(role, permission))) {
    throw new Error(`Perfil ${role || "desconhecido"} sem permissao ${permissions.join(" ou ")}`);
  }
}

function idempotent(request, key, producer) {
  const headerKey = request.headers["idempotency-key"];
  const finalKey = headerKey || key;
  if (!finalKey) {
    const result = producer();
    persist();
    return result;
  }

  if (Object.prototype.hasOwnProperty.call(data.idempotency, finalKey)) {
    return data.idempotency[finalKey];
  }

  const result = producer();
  data.idempotency[finalKey] = clone(result);
  persist();
  return result;
}

function audit(tenantId, actor, action, entity) {
  data.auditLog.unshift({
    id: nextId("AUD", data.auditLog, 3),
    tenantId,
    actor,
    action,
    entity,
    at: safeNow()
  });
}

function nextId(prefix, collection, pad = 4) {
  const max = collection.reduce((highest, item) => {
    const value = Number(String(item.id || "").split("-").pop());
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(pad, "0")}`;
}

function nextFreightId() {
  const year = new Date().getFullYear();
  const prefix = `FRT-${year}`;
  const max = data.freights.reduce((highest, freight) => {
    if (!String(freight.id).startsWith(prefix)) return highest;
    const value = Number(String(freight.id).split("-").pop());
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
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

function createFreight(tenantId, role, payload) {
  validateFreight(payload);

  const distanceKm = Number(payload.distanceKm || 420);
  const tolls = Number(payload.tolls || 280);
  const cargoValue = Number(payload.cargoValue);
  const axles = Number(payload.axles || 4);

  const freight = {
    id: nextFreightId(),
    tenantId,
    shipper: payload.shipper,
    origin: {
      city: payload.originCity,
      uf: String(payload.originUf).toUpperCase(),
      lat: Number(payload.originLat || 0),
      lng: Number(payload.originLng || 0)
    },
    destination: {
      city: payload.destinationCity,
      uf: String(payload.destinationUf).toUpperCase(),
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
    requirements: payload.requirements || ["RNTRC ativo", "Documentos validos", "Rastreamento"],
    createdAt: safeNow()
  };

  freight.estimate = estimateFreightCost({
    distanceKm: freight.distanceKm,
    tolls: freight.tolls,
    cargoValue: freight.cargoValue,
    axles: freight.axles
  });

  data.freights.unshift(freight);
  audit(tenantId, role, "freight:create", freight.id);
  return freight;
}

function createDriver(tenantId, role, payload) {
  const required = ["name", "city", "uf", "vehiclePlate"];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) {
    throw new Error(`Campos obrigatorios ausentes: ${missing.join(", ")}`);
  }

  const driver = {
    id: nextId("DRV", data.drivers, 3),
    tenantId,
    name: payload.name,
    phone: payload.phone || "",
    city: payload.city,
    uf: String(payload.uf).toUpperCase(),
    rating: Number(payload.rating || 4.6),
    distanceToPickupKm: Number(payload.distanceToPickupKm || 30),
    available: payload.available !== false,
    rntrcStatus: payload.rntrcStatus || "active",
    documentsStatus: payload.documentsStatus || "valid",
    riskScore: Number(payload.riskScore || 24),
    vehiclePlate: String(payload.vehiclePlate).toUpperCase(),
    vehicleTypes: payload.vehicleTypes || ["truck"],
    bodyTypes: payload.bodyTypes || ["bau"],
    previousRoutes: payload.previousRoutes || ["SP"],
    returnInterest: payload.returnInterest !== false,
    lastProofOfLife: payload.lastProofOfLife || `${new Date().toISOString().slice(0, 10)} ${displayTime()}`
  };

  data.drivers.unshift(driver);
  audit(tenantId, role, "driver:create", driver.id);
  return driver;
}

function createOffer(request, tenantId, role, payload) {
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
      id: nextId("OFR", data.offers, 4),
      tenantId,
      freightId: freight.id,
      driverId: driver.id,
      driverName: driver.name,
      amount: Number(payload.amount || freight.price),
      status: "sent",
      message: payload.message || "Proposta enviada pela torre de controle",
      createdAt: safeNow()
    };

    data.offers.unshift(offer);
    if (["PUBLISHED", "MATCHING"].includes(freight.status)) {
      freight.status = "NEGOTIATING";
    }
    audit(tenantId, role, "offer:create", offer.id);
    return offer;
  });
}

function createFiscalDocument(tenantId, tripId, type, status = "pending") {
  const prefixes = {
    "CT-e": "CTE",
    "MDF-e": "MDFE",
    CIOT: "CIOT"
  };
  const prefix = prefixes[type] || "DOC";
  const id = nextId(`DOC-${prefix}`, data.fiscalDocuments, 3);
  return {
    id,
    tenantId,
    tripId,
    type,
    key: `${prefix}-${new Date().getFullYear()}-${id.split("-").pop()}`,
    status,
    environment: "homologacao",
    protocol: ""
  };
}

function createContract(request, tenantId, role, payload) {
  const offer = data.offers.find((item) => item.id === payload.offerId);
  if (!offer || offer.tenantId !== tenantId) {
    throw new Error("Proposta nao encontrada");
  }

  return idempotent(request, payload.idempotencyKey, () => {
    const freight = data.freights.find((item) => item.id === offer.freightId);
    const driver = data.drivers.find((item) => item.id === offer.driverId);
    if (!freight || !driver) {
      throw new Error("Proposta sem frete ou motorista valido");
    }

    freight.status = "ACCEPTED";
    offer.status = "accepted";
    data.offers
      .filter((item) => item.freightId === freight.id && item.id !== offer.id)
      .forEach((item) => {
        item.status = "superseded";
      });

    const contract = {
      id: nextId("CTR", data.contracts, 4),
      tenantId,
      freightId: freight.id,
      offerId: offer.id,
      driverId: driver.id,
      amount: offer.amount,
      status: "active",
      createdAt: safeNow()
    };

    const trip = {
      id: nextId("TRP", data.trips, 4),
      tenantId,
      freightId: freight.id,
      driverId: driver.id,
      contractId: contract.id,
      status: "DOCUMENTATION",
      vehiclePlate: driver.vehiclePlate,
      route: `${freight.origin.city}/${freight.origin.uf} -> ${freight.destination.city}/${freight.destination.uf}`,
      eta: freight.deliveryEta,
      progress: 12,
      alerts: [{ type: "document", text: "Preparar CIOT, CT-e e MDF-e em homologacao" }],
      timeline: [
        { at: displayTime(), status: "ACCEPTED", text: "Proposta aceita" },
        { at: displayTime(), status: "DOCUMENTATION", text: "Fluxo documental iniciado" }
      ],
      lastPing: { city: freight.origin.city, uf: freight.origin.uf, speed: 0, at: displayTime() },
      createdAt: safeNow()
    };

    const payment = {
      id: nextId("PAY", data.payments, 3),
      tenantId,
      tripId: trip.id,
      method: "PIX",
      amount: offer.amount,
      status: "escrow",
      idempotencyKey: payload.idempotencyKey || request.headers["idempotency-key"] || "",
      createdAt: safeNow()
    };

    data.contracts.unshift(contract);
    data.trips.unshift(trip);
    data.fiscalDocuments.unshift(createFiscalDocument(tenantId, trip.id, "MDF-e"));
    data.fiscalDocuments.unshift(createFiscalDocument(tenantId, trip.id, "CT-e"));
    data.fiscalDocuments.unshift(createFiscalDocument(tenantId, trip.id, "CIOT"));
    data.payments.unshift(payment);
    audit(tenantId, role, "contract:create", contract.id);
    return { contract, trip, payment };
  });
}

function authorizeFiscalDocument(request, tenantId, role, payload) {
  const document = data.fiscalDocuments.find((item) => item.id === payload.documentId);
  if (!document || document.tenantId !== tenantId) {
    throw new Error("Documento fiscal nao encontrado");
  }

  return idempotent(request, payload.idempotencyKey, () => {
    document.status = "authorized";
    document.protocol = payload.protocol || `HML-${Date.now()}`;
    document.authorizedAt = safeNow();
    audit(tenantId, role, "fiscal:authorize", document.id);
    return document;
  });
}

function settlePayment(request, tenantId, role, paymentId, payload) {
  const payment = data.payments.find((item) => item.id === paymentId);
  if (!payment || payment.tenantId !== tenantId) {
    throw new Error("Pagamento nao encontrado");
  }

  return idempotent(request, payload.idempotencyKey, () => {
    payment.status = "paid";
    payment.settledAt = safeNow();
    const trip = data.trips.find((item) => item.id === payment.tripId && item.tenantId === tenantId);
    if (trip && trip.status === "SETTLEMENT_PENDING") {
      trip.status = "CLOSED";
      trip.progress = 100;
      trip.timeline.push({ at: displayTime(), status: "CLOSED", text: "Pagamento liquidado e operacao encerrada" });
    }
    audit(tenantId, role, "payment:settle", payment.id);
    return payment;
  });
}

function registerTrackingPing(tenantId, role, payload) {
  const trip = data.trips.find((item) => item.id === payload.tripId);
  if (!trip || trip.tenantId !== tenantId) {
    throw new Error("Viagem nao encontrada");
  }

  trip.lastPing = {
    city: payload.city || trip.lastPing.city,
    uf: String(payload.uf || trip.lastPing.uf).toUpperCase(),
    speed: Number(payload.speed || 0),
    at: displayTime()
  };
  trip.progress = Math.max(0, Math.min(100, Number(payload.progress || trip.progress)));
  trip.timeline.push({
    at: displayTime(),
    status: trip.status,
    text: `Ping recebido em ${trip.lastPing.city}/${trip.lastPing.uf}`
  });
  audit(tenantId, role, "tracking:ping", trip.id);
  persist();
  return trip;
}

async function handleApi(request, response, url) {
  const tenant = currentTenant(request);
  const role = currentRole(request);
  const tenantId = tenant.id;

  try {
    if (request.method === "OPTIONS") {
      return sendEmpty(response);
    }

    if (url.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "plataforma-rodoviaria-api",
        environment: process.env.APP_ENV || "development",
        persistence: process.env.DISABLE_FILE_STORE === "1" ? "memory" : "file"
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
        generatedAt: safeNow()
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
      const freight = idempotent(request, payload.idempotencyKey, () => createFreight(tenantId, role, payload));
      return sendJson(response, 201, freight);
    }

    if (url.pathname === "/api/drivers" && request.method === "GET") {
      assertPermission(role, "driver:read");
      const freightId = url.searchParams.get("freightId");
      const freight = data.freights.find((item) => item.id === freightId && item.tenantId === tenantId);
      const drivers = data.drivers.filter((driver) => driver.tenantId === tenantId);
      return sendJson(response, 200, freight ? matchDrivers(freight, drivers) : drivers);
    }

    if (url.pathname === "/api/drivers" && request.method === "POST") {
      assertPermission(role, "driver:create");
      const payload = await readBody(request);
      const driver = idempotent(request, payload.idempotencyKey, () => createDriver(tenantId, role, payload));
      return sendJson(response, 201, driver);
    }

    if (url.pathname === "/api/offers" && request.method === "GET") {
      assertPermission(role, "freight:read");
      return sendJson(response, 200, data.offers.filter((offer) => offer.tenantId === tenantId));
    }

    if (url.pathname === "/api/offers" && request.method === "POST") {
      assertAnyPermission(role, ["freight:negotiate", "offer:create"]);
      const payload = await readBody(request);
      return sendJson(response, 201, createOffer(request, tenantId, role, payload));
    }

    if (url.pathname === "/api/contracts" && request.method === "GET") {
      assertPermission(role, "trip:read");
      return sendJson(response, 200, data.contracts.filter((contract) => contract.tenantId === tenantId));
    }

    if (url.pathname === "/api/contracts" && request.method === "POST") {
      assertPermission(role, "contract:create");
      const payload = await readBody(request);
      return sendJson(response, 201, createContract(request, tenantId, role, payload));
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
          at: displayTime(),
          status: payload.targetStatus,
          text: payload.note || STATUS_LABELS[payload.targetStatus] || payload.targetStatus
        });
        audit(tenantId, role, "trip:advance", trip.id);
        return trip;
      });

      return sendJson(response, 200, result);
    }

    if (url.pathname === "/api/tracking/ping" && request.method === "POST") {
      assertPermission(role, "tracking:write");
      const payload = await readBody(request);
      return sendJson(response, 200, registerTrackingPing(tenantId, role, payload));
    }

    if (url.pathname === "/api/fiscal" && request.method === "GET") {
      assertPermission(role, "fiscal:read");
      return sendJson(response, 200, data.fiscalDocuments.filter((doc) => doc.tenantId === tenantId));
    }

    if (url.pathname === "/api/fiscal/authorize" && request.method === "POST") {
      assertPermission(role, "fiscal:write");
      const payload = await readBody(request);
      return sendJson(response, 200, authorizeFiscalDocument(request, tenantId, role, payload));
    }

    if (url.pathname === "/api/finance" && request.method === "GET") {
      assertPermission(role, "finance:read");
      return sendJson(response, 200, data.payments.filter((payment) => payment.tenantId === tenantId));
    }

    const settleMatch = url.pathname.match(/^\/api\/payments\/([^/]+)\/settle$/);
    if (settleMatch && request.method === "POST") {
      assertPermission(role, "finance:settle");
      const payload = await readBody(request);
      return sendJson(response, 200, settlePayment(request, tenantId, role, settleMatch[1], payload));
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

    if (url.pathname === "/api/incidents" && request.method === "GET") {
      assertPermission(role, "trip:read");
      return sendJson(response, 200, data.incidents.filter((incident) => incident.tenantId === tenantId));
    }

    if (url.pathname === "/api/incidents" && request.method === "POST") {
      assertPermission(role, "incident:create");
      const payload = await readBody(request);
      const incident = {
        id: nextId("INC", data.incidents, 4),
        tenantId,
        tripId: payload.tripId,
        type: payload.type || "operacional",
        severity: payload.severity || "alta",
        message: payload.message || "Ocorrencia registrada pela torre",
        createdAt: safeNow()
      };

      data.incidents.unshift(incident);
      const trip = data.trips.find((item) => item.id === payload.tripId && item.tenantId === tenantId);
      if (trip && trip.status !== "CLOSED") {
        trip.alerts.unshift({ type: "incident", text: incident.message });
        if (nextStatuses(trip.status).includes("INCIDENT")) {
          trip.status = "INCIDENT";
          trip.timeline.push({ at: displayTime(), status: "INCIDENT", text: incident.message });
        }
      }
      audit(tenantId, role, "incident:create", incident.id);
      persist();
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
      persist();
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

function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, response, url);
    }

    return serveStatic(request, response, url.pathname);
  });
}

function startServer(port = PORT, callback) {
  const server = createServer();
  server.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`Plataforma Rodoviaria rodando em http://localhost:${actualPort}`);
    if (callback) callback(server);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer,
  data,
  store
};
