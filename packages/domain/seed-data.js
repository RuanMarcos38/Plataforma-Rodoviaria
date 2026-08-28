const { estimateFreightCost } = require("./calculations");

function createSeedData() {
  const tenants = [
    {
      id: "tenant-rodonorte",
      name: "RodoNorte Transportes",
      segment: "Transportadora",
      city: "Campinas",
      uf: "SP",
      brand: {
        appName: process.env.PUBLIC_APP_NAME || "R2R Logística",
        primaryColor: "#0f5f63",
        accentColor: "#f97316"
      }
    },
    {
      id: "tenant-agrovale",
      name: "Agrovale Alimentos",
      segment: "Embarcador",
      city: "Ribeirão Preto",
      uf: "SP",
      brand: {
        appName: "R2R Logística",
        primaryColor: "#124559",
        accentColor: "#f59e0b"
      }
    }
  ];

  const freights = [
    {
      id: "FRT-2408-001",
      tenantId: "tenant-rodonorte",
      shipper: "AgroVale Alimentos",
      origin: { city: "Ribeirão Preto", uf: "SP", lat: -21.1704, lng: -47.8103 },
      destination: { city: "Contagem", uf: "MG", lat: -19.9317, lng: -44.0536 },
      cargo: "Alimentos secos paletizados",
      weightKg: 18700,
      volumeM3: 62,
      cargoValue: 185000,
      requiredVehicle: "truck",
      requiredBody: "bau",
      axles: 4,
      distanceKm: 545,
      tolls: 428,
      pickupWindow: "Hoje, 14:00-17:00",
      deliveryEta: "Amanhã, 09:30",
      status: "MATCHING",
      riskScore: 34,
      priority: "alta",
      returnOpportunity: true,
      price: 6900,
      requirements: ["RNTRC ativo", "CRLV válido", "Seguro de carga", "Rastreador online"]
    },
    {
      id: "FRT-2408-002",
      tenantId: "tenant-rodonorte",
      shipper: "MetalSul Indústria",
      origin: { city: "Joinville", uf: "SC", lat: -26.3044, lng: -48.8487 },
      destination: { city: "Guarulhos", uf: "SP", lat: -23.4543, lng: -46.5337 },
      cargo: "Peças automotivas",
      weightKg: 9200,
      volumeM3: 39,
      cargoValue: 310000,
      requiredVehicle: "toco",
      requiredBody: "sider",
      axles: 3,
      distanceKm: 523,
      tolls: 312,
      pickupWindow: "Amanhã, 08:00-10:00",
      deliveryEta: "Amanhã, 21:00",
      status: "NEGOTIATING",
      riskScore: 46,
      priority: "media",
      returnOpportunity: false,
      price: 5800,
      requirements: ["Seguro RCTR-C", "Ajudante na descarga", "Baixa avaria"]
    },
    {
      id: "FRT-2408-003",
      tenantId: "tenant-rodonorte",
      shipper: "FrioBrasil",
      origin: { city: "Itajaí", uf: "SC", lat: -26.9101, lng: -48.6705 },
      destination: { city: "Curitiba", uf: "PR", lat: -25.429, lng: -49.2671 },
      cargo: "Carga refrigerada",
      weightKg: 12800,
      volumeM3: 48,
      cargoValue: 268000,
      requiredVehicle: "carreta",
      requiredBody: "refrigerado",
      axles: 6,
      distanceKm: 218,
      tolls: 167,
      pickupWindow: "Hoje, 19:00-22:00",
      deliveryEta: "Amanhã, 06:40",
      status: "PUBLISHED",
      riskScore: 59,
      priority: "alta",
      returnOpportunity: true,
      price: 4400,
      requirements: ["Temperatura monitorada", "Rastreador", "Comprovante ePOD"]
    },
    {
      id: "FRT-2408-004",
      tenantId: "tenant-agrovale",
      shipper: "Agrovale Alimentos",
      origin: { city: "Uberaba", uf: "MG", lat: -19.7472, lng: -47.9381 },
      destination: { city: "Santos", uf: "SP", lat: -23.9608, lng: -46.3336 },
      cargo: "Insumos agrícolas",
      weightKg: 22400,
      volumeM3: 70,
      cargoValue: 420000,
      requiredVehicle: "carreta",
      requiredBody: "graneleiro",
      axles: 6,
      distanceKm: 590,
      tolls: 490,
      pickupWindow: "Sexta, 07:00-12:00",
      deliveryEta: "Sábado, 18:00",
      status: "PUBLISHED",
      riskScore: 28,
      priority: "media",
      returnOpportunity: true,
      price: 7300,
      requirements: ["MDF-e", "CIOT", "Vale-pedágio"]
    }
  ];

  const drivers = [
    {
      id: "DRV-101",
      tenantId: "tenant-rodonorte",
      name: "Carlos Henrique",
      phone: "+55 19 90000-1001",
      city: "Sertãozinho",
      uf: "SP",
      rating: 4.9,
      distanceToPickupKm: 18,
      available: true,
      rntrcStatus: "active",
      documentsStatus: "valid",
      riskScore: 18,
      vehiclePlate: "R2R1A24",
      vehicleTypes: ["truck", "carreta"],
      bodyTypes: ["bau", "sider"],
      previousRoutes: ["MG", "GO", "SP"],
      returnInterest: true,
      lastProofOfLife: "2026-08-28 07:42"
    },
    {
      id: "DRV-102",
      tenantId: "tenant-rodonorte",
      name: "Mariana Lopes",
      phone: "+55 47 90000-2202",
      city: "Blumenau",
      uf: "SC",
      rating: 4.7,
      distanceToPickupKm: 42,
      available: true,
      rntrcStatus: "active",
      documentsStatus: "valid",
      riskScore: 24,
      vehiclePlate: "MLO8B12",
      vehicleTypes: ["toco", "truck"],
      bodyTypes: ["sider", "bau"],
      previousRoutes: ["SP", "PR", "SC"],
      returnInterest: false,
      lastProofOfLife: "2026-08-28 09:10"
    },
    {
      id: "DRV-103",
      tenantId: "tenant-rodonorte",
      name: "João Batista",
      phone: "+55 11 90000-3303",
      city: "Osasco",
      uf: "SP",
      rating: 4.6,
      distanceToPickupKm: 74,
      available: false,
      rntrcStatus: "active",
      documentsStatus: "review",
      riskScore: 52,
      vehiclePlate: "JBT7C90",
      vehicleTypes: ["carreta"],
      bodyTypes: ["refrigerado", "bau"],
      previousRoutes: ["PR", "RJ", "MG"],
      returnInterest: true,
      lastProofOfLife: "2026-08-27 18:11"
    },
    {
      id: "DRV-201",
      tenantId: "tenant-agrovale",
      name: "Paulo Andrade",
      phone: "+55 34 90000-4404",
      city: "Uberlândia",
      uf: "MG",
      rating: 4.8,
      distanceToPickupKm: 38,
      available: true,
      rntrcStatus: "active",
      documentsStatus: "valid",
      riskScore: 20,
      vehiclePlate: "PAA3D10",
      vehicleTypes: ["carreta"],
      bodyTypes: ["graneleiro", "bau"],
      previousRoutes: ["SP", "MG", "GO"],
      returnInterest: true,
      lastProofOfLife: "2026-08-28 08:22"
    }
  ];

  const trips = [
    {
      id: "TRP-9001",
      tenantId: "tenant-rodonorte",
      freightId: "FRT-2408-001",
      driverId: "DRV-101",
      status: "IN_TRANSIT",
      vehiclePlate: "R2R1A24",
      route: "Ribeirão Preto/SP → Contagem/MG",
      eta: "2026-08-29 09:30",
      progress: 58,
      alerts: [],
      timeline: [
        { at: "08:00", status: "PUBLISHED", text: "Frete publicado" },
        { at: "08:05", status: "MATCHING", text: "Motorista recomendado" },
        { at: "08:10", status: "ACCEPTED", text: "Contratação aceita" },
        { at: "08:18", status: "DOCUMENTATION", text: "CIOT preparado" },
        { at: "09:40", status: "IN_TRANSIT", text: "Carga em trânsito" }
      ],
      lastPing: { city: "Franca", uf: "SP", speed: 72, at: "10:48" }
    },
    {
      id: "TRP-9002",
      tenantId: "tenant-rodonorte",
      freightId: "FRT-2408-002",
      driverId: "DRV-102",
      status: "DOCUMENTATION",
      vehiclePlate: "MLO8B12",
      route: "Joinville/SC → Guarulhos/SP",
      eta: "2026-08-29 21:00",
      progress: 20,
      alerts: [{ type: "document", text: "MDF-e aguardando autorização" }],
      timeline: [
        { at: "10:05", status: "PUBLISHED", text: "Carga publicada" },
        { at: "10:22", status: "NEGOTIATING", text: "Proposta recebida" },
        { at: "10:31", status: "DOCUMENTATION", text: "Documentos em emissao" }
      ],
      lastPing: { city: "Blumenau", uf: "SC", speed: 0, at: "10:50" }
    },
    {
      id: "TRP-9101",
      tenantId: "tenant-agrovale",
      freightId: "FRT-2408-004",
      driverId: "DRV-201",
      status: "SCHEDULED_PICKUP",
      vehiclePlate: "PAA3D10",
      route: "Uberaba/MG → Santos/SP",
      eta: "2026-08-30 18:00",
      progress: 8,
      alerts: [],
      timeline: [
        { at: "07:30", status: "PUBLISHED", text: "Solicitação criada" },
        { at: "08:12", status: "ACCEPTED", text: "Transportadora contratada" },
        { at: "09:00", status: "SCHEDULED_PICKUP", text: "Coleta agendada" }
      ],
      lastPing: { city: "Uberlândia", uf: "MG", speed: 0, at: "10:52" }
    }
  ];

  const fiscalDocuments = [
    {
      id: "DOC-CTE-001",
      tenantId: "tenant-rodonorte",
      tripId: "TRP-9001",
      type: "CT-e",
      key: "35260800000000000000570010000000011000000010",
      status: "authorized",
      environment: "homologacao",
      protocol: "135260000000101"
    },
    {
      id: "DOC-MDFE-002",
      tenantId: "tenant-rodonorte",
      tripId: "TRP-9002",
      type: "MDF-e",
      key: "42260800000000000000580010000000022000000020",
      status: "pending",
      environment: "homologacao",
      protocol: ""
    },
    {
      id: "DOC-CIOT-004",
      tenantId: "tenant-agrovale",
      tripId: "TRP-9101",
      type: "CIOT",
      key: "CIOT-2026-000004",
      status: "authorized",
      environment: "homologacao",
      protocol: "CIOT-HML-4004"
    }
  ];

  const payments = [
    {
      id: "PAY-001",
      tenantId: "tenant-rodonorte",
      tripId: "TRP-9001",
      method: "PIX",
      amount: 6900,
      status: "escrow",
      idempotencyKey: "seed-pay-001"
    },
    {
      id: "PAY-002",
      tenantId: "tenant-rodonorte",
      tripId: "TRP-9002",
      method: "boleto",
      amount: 5800,
      status: "pending",
      idempotencyKey: "seed-pay-002"
    },
    {
      id: "PAY-003",
      tenantId: "tenant-agrovale",
      tripId: "TRP-9101",
      method: "PIX",
      amount: 7300,
      status: "paid",
      idempotencyKey: "seed-pay-003"
    }
  ];

  const offers = [];
  const contracts = [];
  const incidents = [];
  const auditLog = [
    {
      id: "AUD-001",
      tenantId: "tenant-rodonorte",
      actor: "system",
      action: "bootstrap",
      entity: "workspace",
      at: new Date().toISOString()
    }
  ];

  freights.forEach((freight) => {
    freight.estimate = estimateFreightCost({
      distanceKm: freight.distanceKm,
      tolls: freight.tolls,
      cargoValue: freight.cargoValue,
      axles: freight.axles
    });
  });

  return {
    tenants,
    freights,
    drivers,
    trips,
    fiscalDocuments,
    payments,
    offers,
    contracts,
    incidents,
    auditLog,
    idempotency: {}
  };
}

module.exports = {
  createSeedData
};
