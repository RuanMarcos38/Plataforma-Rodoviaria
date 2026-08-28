const OPERATION_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "MATCHING",
  "NEGOTIATING",
  "ACCEPTED",
  "DOCUMENTATION",
  "SCHEDULED_PICKUP",
  "EN_ROUTE_PICKUP",
  "AT_PICKUP",
  "LOADING",
  "IN_TRANSIT",
  "AT_DESTINATION",
  "UNLOADING",
  "DELIVERED",
  "DOCUMENT_PENDING",
  "SETTLEMENT_PENDING",
  "CLOSED",
  "CANCELLED",
  "INCIDENT"
];

const STATUS_LABELS = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  MATCHING: "Buscando motorista",
  NEGOTIATING: "Em negociacao",
  ACCEPTED: "Aceito",
  DOCUMENTATION: "Documentacao",
  SCHEDULED_PICKUP: "Coleta agendada",
  EN_ROUTE_PICKUP: "Indo para coleta",
  AT_PICKUP: "Na coleta",
  LOADING: "Carregando",
  IN_TRANSIT: "Em transito",
  AT_DESTINATION: "No destino",
  UNLOADING: "Descarregando",
  DELIVERED: "Entregue",
  DOCUMENT_PENDING: "Documento pendente",
  SETTLEMENT_PENDING: "Pagamento pendente",
  CLOSED: "Encerrado",
  CANCELLED: "Cancelado",
  INCIDENT: "Ocorrencia"
};

const ALLOWED_TRANSITIONS = {
  DRAFT: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["MATCHING", "NEGOTIATING", "CANCELLED"],
  MATCHING: ["NEGOTIATING", "CANCELLED"],
  NEGOTIATING: ["ACCEPTED", "PUBLISHED", "CANCELLED"],
  ACCEPTED: ["DOCUMENTATION", "CANCELLED"],
  DOCUMENTATION: ["SCHEDULED_PICKUP", "DOCUMENT_PENDING", "CANCELLED"],
  DOCUMENT_PENDING: ["DOCUMENTATION", "CANCELLED"],
  SCHEDULED_PICKUP: ["EN_ROUTE_PICKUP", "CANCELLED"],
  EN_ROUTE_PICKUP: ["AT_PICKUP", "INCIDENT"],
  AT_PICKUP: ["LOADING", "INCIDENT"],
  LOADING: ["IN_TRANSIT", "INCIDENT"],
  IN_TRANSIT: ["AT_DESTINATION", "INCIDENT"],
  AT_DESTINATION: ["UNLOADING", "INCIDENT"],
  UNLOADING: ["DELIVERED", "INCIDENT"],
  DELIVERED: ["SETTLEMENT_PENDING"],
  SETTLEMENT_PENDING: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
  INCIDENT: ["IN_TRANSIT", "CANCELLED", "DOCUMENT_PENDING"]
};

function canTransition(from, to) {
  return Boolean(ALLOWED_TRANSITIONS[from] && ALLOWED_TRANSITIONS[from].includes(to));
}

function nextStatuses(from) {
  return ALLOWED_TRANSITIONS[from] || [];
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`Transicao invalida de ${from} para ${to}`);
  }
}

module.exports = {
  OPERATION_STATUSES,
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
  canTransition,
  nextStatuses,
  assertTransition
};
