const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const dataFile = path.join(os.tmpdir(), `plataforma-rodoviaria-test-${process.pid}.json`);
process.env.DATA_FILE = dataFile;
process.env.DISABLE_FILE_STORE = "0";

const { startServer } = require("../apps/api/server");

const tenantHeaders = {
  "Content-Type": "application/json",
  "x-tenant-id": "tenant-rodonorte",
  "x-role": "CARRIER_MANAGER"
};

function request(baseUrl, route, options = {}) {
  return fetch(`${baseUrl}${route}`, {
    ...options,
    headers: {
      ...tenantHeaders,
      ...(options.headers || {})
    }
  }).then(async (response) => {
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    return { response, body };
  });
}

async function run() {
  if (fs.existsSync(dataFile)) {
    fs.unlinkSync(dataFile);
  }

  const server = await new Promise((resolve) => {
    const instance = startServer(0, resolve);
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await request(baseUrl, "/api/health");
    assert.equal(health.response.status, 200);
    assert.equal(health.body.ok, true);

    const html = await fetch(`${baseUrl}/`).then((response) => response.text());
    assert.ok(html.includes("Torre de controle nacional"));

    const customerPayload = {
      name: "Cliente API V2",
      legalName: "Cliente API V2 Ltda",
      cnpj: "12.345.678/0001-95",
      city: "Campinas",
      uf: "SP",
      email: "operacao@cliente.test"
    };
    const createdCustomer = await request(baseUrl, "/api/v1/customers", {
      method: "POST",
      headers: { "Idempotency-Key": "http-customer-001" },
      body: JSON.stringify(customerPayload)
    });
    assert.equal(createdCustomer.response.status, 201);
    assert.ok(createdCustomer.body.id.startsWith("CUS-"));
    assert.equal(createdCustomer.body.cnpj, "12345678000195");

    const customerList = await request(baseUrl, "/api/v1/customers?q=Cliente%20API");
    assert.equal(customerList.response.status, 200);
    assert.ok(customerList.body.some((item) => item.id === createdCustomer.body.id));

    const duplicateCustomer = await request(baseUrl, "/api/v1/customers", {
      method: "POST",
      headers: { "Idempotency-Key": "http-customer-duplicate" },
      body: JSON.stringify(customerPayload)
    });
    assert.equal(duplicateCustomer.response.status, 400);

    const vehiclePayload = {
      plate: "ABC-1D23",
      type: "truck",
      bodyType: "bau",
      ownerType: "proprio",
      capacityKg: 14000,
      axles: 4
    };
    const createdVehicle = await request(baseUrl, "/api/v1/vehicles", {
      method: "POST",
      headers: { "Idempotency-Key": "http-vehicle-001" },
      body: JSON.stringify(vehiclePayload)
    });
    assert.equal(createdVehicle.response.status, 201);
    assert.ok(createdVehicle.body.id.startsWith("VEH-"));
    assert.equal(createdVehicle.body.plate, "ABC1D23");

    const vehicleList = await request(baseUrl, "/api/v1/vehicles?status=available");
    assert.equal(vehicleList.response.status, 200);
    assert.ok(vehicleList.body.some((item) => item.id === createdVehicle.body.id));

    const otherTenantCustomers = await request(baseUrl, "/api/v1/customers", {
      headers: {
        "x-tenant-id": "tenant-agrovale",
        "x-role": "SHIPPER_OPERATOR"
      }
    });
    assert.equal(otherTenantCustomers.response.status, 200);
    assert.equal(otherTenantCustomers.body.some((item) => item.id === createdCustomer.body.id), false);

    const otherTenantVehicles = await request(baseUrl, "/api/v1/vehicles", {
      headers: {
        "x-tenant-id": "tenant-agrovale",
        "x-role": "SHIPPER_OPERATOR"
      }
    });
    assert.equal(otherTenantVehicles.response.status, 200);
    assert.equal(otherTenantVehicles.body.some((item) => item.id === createdVehicle.body.id), false);

    const forbiddenCustomerCreate = await request(baseUrl, "/api/v1/customers", {
      method: "POST",
      headers: {
        "x-tenant-id": "tenant-rodonorte",
        "x-role": "CUSTOMER_VIEWER",
        "Content-Type": "application/json",
        "Idempotency-Key": "http-customer-forbidden"
      },
      body: JSON.stringify({ ...customerPayload, cnpj: "98765432000100" })
    });
    assert.equal(forbiddenCustomerCreate.response.status, 403);

    const freightPayload = {
      shipper: "Teste Integrado",
      originCity: "Campinas",
      originUf: "SP",
      destinationCity: "Betim",
      destinationUf: "MG",
      cargo: "Carga teste",
      weightKg: 10000,
      cargoValue: 180000,
      requiredVehicle: "truck",
      requiredBody: "bau",
      distanceKm: 570,
      tolls: 410,
      idempotencyKey: "http-freight-001"
    };
    const createdFreight = await request(baseUrl, "/api/freights", {
      method: "POST",
      headers: { "Idempotency-Key": freightPayload.idempotencyKey },
      body: JSON.stringify(freightPayload)
    });
    assert.equal(createdFreight.response.status, 201);
    assert.ok(createdFreight.body.id.startsWith("FRT-"));

    const createdDriver = await request(baseUrl, "/api/drivers", {
      method: "POST",
      headers: { "Idempotency-Key": "http-driver-001" },
      body: JSON.stringify({
        name: "Motorista Teste",
        city: "Campinas",
        uf: "SP",
        vehiclePlate: "TST1A23",
        vehicleTypes: ["truck"],
        bodyTypes: ["bau"]
      })
    });
    assert.equal(createdDriver.response.status, 201);

    const rankedDrivers = await request(baseUrl, `/api/drivers?freightId=${createdFreight.body.id}`);
    assert.equal(rankedDrivers.response.status, 200);
    assert.ok(rankedDrivers.body.some((driver) => driver.id === createdDriver.body.id));

    const offer = await request(baseUrl, "/api/offers", {
      method: "POST",
      headers: { "Idempotency-Key": "http-offer-001" },
      body: JSON.stringify({
        freightId: createdFreight.body.id,
        driverId: createdDriver.body.id,
        amount: createdFreight.body.price
      })
    });
    assert.equal(offer.response.status, 201);

    const duplicateOffer = await request(baseUrl, "/api/offers", {
      method: "POST",
      headers: { "Idempotency-Key": "http-offer-001" },
      body: JSON.stringify({
        freightId: createdFreight.body.id,
        driverId: createdDriver.body.id,
        amount: createdFreight.body.price
      })
    });
    assert.equal(duplicateOffer.body.id, offer.body.id);

    const contract = await request(baseUrl, "/api/contracts", {
      method: "POST",
      headers: { "Idempotency-Key": "http-contract-001" },
      body: JSON.stringify({ offerId: offer.body.id })
    });
    assert.equal(contract.response.status, 201);
    assert.ok(contract.body.trip.id.startsWith("TRP-"));

    const tracking = await request(baseUrl, "/api/tracking/ping", {
      method: "POST",
      body: JSON.stringify({
        tripId: contract.body.trip.id,
        city: "Extrema",
        uf: "MG",
        speed: 68,
        progress: 35
      })
    });
    assert.equal(tracking.response.status, 200);
    assert.equal(tracking.body.lastPing.city, "Extrema");

    const fiscal = await request(baseUrl, "/api/fiscal");
    const pendingDoc = fiscal.body.find((document) => document.tripId === contract.body.trip.id && document.status === "pending");
    assert.ok(pendingDoc);

    const authorized = await request(baseUrl, "/api/fiscal/authorize", {
      method: "POST",
      headers: { "Idempotency-Key": "http-fiscal-001" },
      body: JSON.stringify({ documentId: pendingDoc.id })
    });
    assert.equal(authorized.response.status, 200);
    assert.equal(authorized.body.status, "authorized");

    const payments = await request(baseUrl, "/api/finance");
    const payment = payments.body.find((item) => item.tripId === contract.body.trip.id);
    assert.ok(payment);

    const settled = await request(baseUrl, `/api/payments/${payment.id}/settle`, {
      method: "POST",
      headers: { "Idempotency-Key": "http-payment-001" },
      body: JSON.stringify({})
    });
    assert.equal(settled.response.status, 200);
    assert.equal(settled.body.status, "paid");

    const forbidden = await request(baseUrl, "/api/freights", {
      method: "POST",
      headers: {
        "x-tenant-id": "tenant-rodonorte",
        "x-role": "CUSTOMER_VIEWER",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(freightPayload)
    });
    assert.equal(forbidden.response.status, 403);

    assert.ok(fs.existsSync(dataFile));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (fs.existsSync(dataFile)) {
      fs.unlinkSync(dataFile);
    }
  }
}

if (require.main === module) {
  run()
    .then(() => console.log("Todos os testes HTTP passaram."))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  run
};
