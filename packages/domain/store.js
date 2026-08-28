const fs = require("fs");
const path = require("path");
const { estimateFreightCost } = require("./calculations");

const COLLECTIONS = [
  "tenants",
  "freights",
  "drivers",
  "trips",
  "fiscalDocuments",
  "payments",
  "offers",
  "contracts",
  "incidents",
  "auditLog"
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeData(input, seedData) {
  const data = {
    ...clone(seedData),
    ...clone(input || {})
  };

  COLLECTIONS.forEach((collection) => {
    if (!Array.isArray(data[collection])) {
      data[collection] = [];
    }
  });

  data.idempotency = data.idempotency && typeof data.idempotency === "object" && !Array.isArray(data.idempotency)
    ? data.idempotency
    : {};

  data.freights.forEach((freight) => {
    if (!freight.estimate) {
      freight.estimate = estimateFreightCost({
        distanceKm: freight.distanceKm,
        tolls: freight.tolls,
        cargoValue: freight.cargoValue,
        axles: freight.axles
      });
    }
  });

  data.trips.forEach((trip) => {
    if (!Array.isArray(trip.alerts)) trip.alerts = [];
    if (!Array.isArray(trip.timeline)) trip.timeline = [];
  });

  return data;
}

function serializeData(data) {
  const output = {};
  COLLECTIONS.forEach((collection) => {
    output[collection] = data[collection];
  });
  output.idempotency = data.idempotency || {};
  return output;
}

function createFileStore(filePath, seedFactory) {
  const seedData = seedFactory();
  let data = seedData;

  if (filePath && fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf8");
    data = normalizeData(JSON.parse(raw), seedData);
  } else {
    data = normalizeData(seedData, seedData);
  }

  function save() {
    if (!filePath || process.env.DISABLE_FILE_STORE === "1") return;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(serializeData(data), null, 2)}\n`);
  }

  function reset() {
    data = normalizeData(seedFactory(), seedFactory());
    save();
    return data;
  }

  return {
    data,
    save,
    reset
  };
}

module.exports = {
  createFileStore,
  normalizeData,
  serializeData
};
