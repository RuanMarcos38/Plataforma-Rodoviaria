const ROLES = {
  PLATFORM_ADMIN: {
    label: "Administrador master",
    permissions: ["*"]
  },
  CARRIER_MANAGER: {
    label: "Transportadora",
    permissions: [
      "dashboard:read",
      "freight:create",
      "freight:read",
      "freight:negotiate",
      "contract:create",
      "trip:read",
      "trip:advance",
      "tracking:write",
      "driver:read",
      "driver:create",
      "fiscal:read",
      "fiscal:write",
      "finance:read",
      "finance:settle",
      "incident:create",
      "brand:update"
    ]
  },
  SHIPPER_OPERATOR: {
    label: "Embarcador",
    permissions: [
      "dashboard:read",
      "freight:create",
      "freight:read",
      "freight:negotiate",
      "contract:create",
      "trip:read",
      "fiscal:read",
      "finance:read"
    ]
  },
  DRIVER_TAC: {
    label: "Caminhoneiro TAC",
    permissions: [
      "dashboard:read",
      "freight:read",
      "offer:create",
      "trip:read",
      "trip:advance",
      "tracking:write",
      "incident:create"
    ]
  },
  CUSTOMER_VIEWER: {
    label: "Cliente final",
    permissions: ["dashboard:read", "trip:read", "fiscal:read"]
  }
};

function hasPermission(role, permission) {
  const permissions = ROLES[role]?.permissions || [];
  return permissions.includes("*") || permissions.includes(permission);
}

function assertPermission(role, permission) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Perfil ${role || "desconhecido"} sem permissao ${permission}`);
  }
}

module.exports = {
  ROLES,
  hasPermission,
  assertPermission
};
