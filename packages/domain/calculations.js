function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function km(value) {
  return `${Number(value || 0).toLocaleString("pt-BR")} km`;
}

function estimateFreightCost(input) {
  const distanceKm = Number(input.distanceKm || 0);
  const tolls = Number(input.tolls || 0);
  const cargoValue = Number(input.cargoValue || 0);
  const axles = Number(input.axles || 2);
  const dieselPrice = Number(input.dieselPrice || 6.05);
  const consumptionKmL = Number(input.consumptionKmL || 2.8);
  const margin = Number(input.margin || 0.18);

  const fuel = (distanceKm / consumptionKmL) * dieselPrice;
  const maintenance = distanceKm * 1.12;
  const insurance = Math.max(cargoValue * 0.004, 180);
  const axleFactor = axles * 72;
  const subtotal = fuel + maintenance + insurance + tolls + axleFactor;
  const price = subtotal * (1 + margin);

  return {
    fuel: Math.round(fuel),
    maintenance: Math.round(maintenance),
    insurance: Math.round(insurance),
    tolls: Math.round(tolls),
    subtotal: Math.round(subtotal),
    suggestedPrice: Math.round(price),
    costPerKm: distanceKm ? Number((subtotal / distanceKm).toFixed(2)) : 0
  };
}

function riskLevel(score) {
  if (score >= 80) return "alto";
  if (score >= 50) return "medio";
  return "baixo";
}

function matchDrivers(freight, drivers) {
  return drivers
    .map((driver) => {
      let score = 40;
      if (driver.bodyTypes.includes(freight.requiredBody)) score += 18;
      if (driver.vehicleTypes.includes(freight.requiredVehicle)) score += 16;
      if (driver.available) score += 10;
      if (driver.documentsStatus === "valid") score += 10;
      if (driver.rntrcStatus === "active") score += 8;
      if (driver.previousRoutes.includes(freight.destination.uf)) score += 6;
      if (driver.returnInterest && freight.returnOpportunity) score += 5;
      score -= Math.min(Math.floor(driver.distanceToPickupKm / 25), 12);
      score -= Math.floor(driver.riskScore / 20);

      return {
        ...driver,
        matchScore: Math.max(0, Math.min(99, score))
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

function computeDashboard(tenantId, data) {
  const freights = data.freights.filter((freight) => freight.tenantId === tenantId);
  const trips = data.trips.filter((trip) => trip.tenantId === tenantId);
  const payments = data.payments.filter((payment) => payment.tenantId === tenantId);
  const drivers = data.drivers.filter((driver) => driver.tenantId === tenantId);

  const openFreights = freights.filter((freight) =>
    ["PUBLISHED", "MATCHING", "NEGOTIATING"].includes(freight.status)
  );
  const inTransit = trips.filter((trip) =>
    ["EN_ROUTE_PICKUP", "AT_PICKUP", "LOADING", "IN_TRANSIT", "AT_DESTINATION", "UNLOADING"].includes(trip.status)
  );
  const delayed = trips.filter((trip) => trip.alerts.some((alert) => alert.type === "delay"));
  const revenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paid = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const onTimeTrips = trips.filter((trip) => !trip.alerts.some((alert) => alert.type === "delay"));
  const otif = trips.length ? Math.round((onTimeTrips.length / trips.length) * 100) : 100;

  return {
    openFreights: openFreights.length,
    activeTrips: inTransit.length,
    delayedTrips: delayed.length,
    driversAvailable: drivers.filter((driver) => driver.available).length,
    fiscalPending: data.fiscalDocuments.filter((doc) => doc.tenantId === tenantId && doc.status !== "authorized").length,
    revenue,
    paid,
    receivable: revenue - paid,
    otif,
    emptyKmReduced: 1260,
    fleetOccupancy: 78
  };
}

module.exports = {
  brl,
  km,
  estimateFreightCost,
  riskLevel,
  matchDrivers,
  computeDashboard
};
