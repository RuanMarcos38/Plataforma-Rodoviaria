const assert = require("assert");

const { canTransition, assertTransition } = require("../packages/domain/status-machine");
const { hasPermission } = require("../packages/domain/rbac");
const { estimateFreightCost, matchDrivers, computeDashboard } = require("../packages/domain/calculations");
const { createSeedData } = require("../packages/domain/seed-data");

function testStateMachine() {
  assert.equal(canTransition("PUBLISHED", "MATCHING"), true);
  assert.equal(canTransition("PUBLISHED", "CLOSED"), false);
  assert.throws(() => assertTransition("IN_TRANSIT", "CLOSED"), /Transição inválida/);
}

function testRbac() {
  assert.equal(hasPermission("PLATFORM_ADMIN", "brand:update"), true);
  assert.equal(hasPermission("CARRIER_MANAGER", "freight:create"), true);
  assert.equal(hasPermission("CUSTOMER_VIEWER", "freight:create"), false);
}

function testFreightEstimate() {
  const estimate = estimateFreightCost({
    distanceKm: 500,
    tolls: 300,
    cargoValue: 200000,
    axles: 4
  });

  assert.ok(estimate.suggestedPrice > estimate.subtotal);
  assert.ok(estimate.costPerKm > 0);
}

function testMatching() {
  const data = createSeedData();
  const freight = data.freights.find((item) => item.id === "FRT-2408-001");
  const drivers = data.drivers.filter((driver) => driver.tenantId === freight.tenantId);
  const ranked = matchDrivers(freight, drivers);

  assert.equal(ranked[0].id, "DRV-101");
  assert.ok(ranked[0].matchScore > ranked[ranked.length - 1].matchScore);
}

function testTenantIsolation() {
  const data = createSeedData();
  const rodonorte = computeDashboard("tenant-rodonorte", data);
  const agrovale = computeDashboard("tenant-agrovale", data);

  assert.notEqual(rodonorte.revenue, agrovale.revenue);
  assert.equal(data.freights.filter((item) => item.tenantId === "tenant-agrovale").length, 1);
}

testStateMachine();
testRbac();
testFreightEstimate();
testMatching();
testTenantIsolation();

console.log("Todos os testes de domínio passaram.");
