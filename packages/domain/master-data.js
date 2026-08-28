function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeUf(value) {
  return normalizeText(value).toUpperCase().slice(0, 2);
}

function normalizePlate(value) {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function validateCustomerPayload(payload) {
  const name = normalizeText(payload.name || payload.legalName);
  const cnpj = digits(payload.cnpj);

  if (!name) {
    throw new Error("Nome/razão social do cliente é obrigatório");
  }
  if (cnpj && cnpj.length !== 14) {
    throw new Error("CNPJ deve conter 14 dígitos");
  }

  return {
    name,
    legalName: normalizeText(payload.legalName || name),
    tradeName: normalizeText(payload.tradeName),
    cnpj,
    stateRegistration: normalizeText(payload.stateRegistration),
    email: normalizeText(payload.email).toLowerCase(),
    phone: normalizeText(payload.phone),
    city: normalizeText(payload.city),
    uf: normalizeUf(payload.uf),
    status: payload.status === "inactive" ? "inactive" : "active",
    tags: Array.isArray(payload.tags) ? payload.tags.map(normalizeText).filter(Boolean) : []
  };
}

function validateVehiclePayload(payload) {
  const plate = normalizePlate(payload.plate);
  const type = normalizeText(payload.type);

  if (!plate) {
    throw new Error("Placa do veículo é obrigatória");
  }
  if (plate.length !== 7) {
    throw new Error("Placa deve conter 7 caracteres alfanuméricos");
  }
  if (!type) {
    throw new Error("Tipo do veículo é obrigatório");
  }

  const capacityKg = Number(payload.capacityKg || 0);
  if (!Number.isFinite(capacityKg) || capacityKg < 0) {
    throw new Error("Capacidade do veículo inválida");
  }

  return {
    plate,
    type,
    bodyType: normalizeText(payload.bodyType),
    ownerType: normalizeText(payload.ownerType || "proprio"),
    ownerName: normalizeText(payload.ownerName),
    renavam: digits(payload.renavam),
    brand: normalizeText(payload.brand),
    model: normalizeText(payload.model),
    year: payload.year ? Number(payload.year) : null,
    axles: payload.axles ? Number(payload.axles) : null,
    capacityKg,
    status: ["available", "reserved", "trip", "maintenance", "blocked"].includes(payload.status)
      ? payload.status
      : "available",
    trackerId: normalizeText(payload.trackerId),
    branchId: normalizeText(payload.branchId),
    costCenterId: normalizeText(payload.costCenterId)
  };
}

module.exports = {
  digits,
  normalizePlate,
  validateCustomerPayload,
  validateVehiclePayload
};
