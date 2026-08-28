const state = {
  view: "control",
  tenantId: localStorage.getItem("r2r.tenantId") || "",
  role: localStorage.getItem("r2r.role") || "CARRIER_MANAGER",
  query: "",
  statusFilter: "all",
  priorityFilter: "all",
  selectedFreightId: "",
  selectedTripId: "",
  bootstrap: null,
  dashboard: null,
  freights: [],
  drivers: [],
  trips: [],
  fiscal: [],
  finance: [],
  offers: [],
  contracts: [],
  incidents: [],
  risk: [],
  audit: []
};

const views = {
  control: "Torre de controle nacional",
  marketplace: "Mercado nacional de fretes",
  matching: "Alocação inteligente de fretes",
  trips: "Central de viagens e rastreamento",
  fiscal: "Operação fiscal e regulatória",
  finance: "Financeiro e pagamentos protegidos",
  admin: "Painel administrativo"
};

const statusLabels = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  MATCHING: "Buscando motorista",
  NEGOTIATING: "Em negociação",
  ACCEPTED: "Aceito",
  DOCUMENTATION: "Documentação",
  SCHEDULED_PICKUP: "Coleta agendada",
  EN_ROUTE_PICKUP: "Indo para coleta",
  AT_PICKUP: "Na coleta",
  LOADING: "Carregando",
  IN_TRANSIT: "Em trânsito",
  AT_DESTINATION: "No destino",
  UNLOADING: "Descarregando",
  DELIVERED: "Entregue",
  DOCUMENT_PENDING: "Documento pendente",
  SETTLEMENT_PENDING: "Pagamento pendente",
  CLOSED: "Encerrado",
  CANCELLED: "Cancelado",
  INCIDENT: "Ocorrência"
};

const offerStatusLabels = {
  sent: "Enviada",
  accepted: "Aceita",
  superseded: "Substituída"
};

const fiscalStatusLabels = {
  authorized: "Autorizado",
  pending: "Pendente"
};

const paymentStatusLabels = {
  escrow: "Protegido em garantia",
  pending: "Pendente",
  paid: "Pago"
};

const paymentMethodLabels = {
  PIX: "PIX",
  boleto: "Boleto"
};

const contractStatusLabels = {
  active: "Ativo",
  closed: "Encerrado",
  cancelled: "Cancelado"
};

const environmentLabels = {
  homologacao: "Homologação",
  producao: "Produção"
};

const vehicleLabels = {
  truck: "Truck",
  toco: "Toco",
  carreta: "Carreta"
};

const bodyLabels = {
  bau: "Baú",
  sider: "Sider",
  refrigerado: "Refrigerado",
  graneleiro: "Graneleiro"
};

const documentStatusLabels = {
  valid: "Documentos válidos",
  review: "Documentos em revisão"
};

const rntrcStatusLabels = {
  active: "RNTRC ativo",
  pending: "RNTRC pendente"
};

const riskLevelLabels = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto"
};

const auditActionLabels = {
  bootstrap: "Sistema iniciado",
  "freight:create": "Carga criada",
  "driver:create": "Motorista cadastrado",
  "offer:create": "Proposta enviada",
  "contract:create": "Contrato criado",
  "trip:advance": "Viagem atualizada",
  "tracking:ping": "Ping de rastreamento",
  "fiscal:authorize": "Documento autorizado",
  "payment:settle": "Pagamento liquidado",
  "incident:create": "Ocorrência registrada",
  "brand:update": "Marca atualizada"
};

const auditEntityLabels = {
  workspace: "Ambiente do sistema"
};

const nextByStatus = {
  DOCUMENTATION: "SCHEDULED_PICKUP",
  SCHEDULED_PICKUP: "EN_ROUTE_PICKUP",
  EN_ROUTE_PICKUP: "AT_PICKUP",
  AT_PICKUP: "LOADING",
  LOADING: "IN_TRANSIT",
  IN_TRANSIT: "AT_DESTINATION",
  AT_DESTINATION: "UNLOADING",
  UNLOADING: "DELIVERED",
  DELIVERED: "SETTLEMENT_PENDING",
  SETTLEMENT_PENDING: "CLOSED",
  INCIDENT: "IN_TRANSIT"
};

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const fallbackIcons = {
  "arrow-right": ">",
  "badge-plus": "+",
  "badge-check": "v",
  "file-check-2": "F",
  handshake: "=",
  info: "i",
  landmark: "$",
  "list-checks": "#",
  "map-pinned": "M",
  "package-search": "[]",
  plus: "+",
  radar: "O",
  "refresh-cw": "@",
  route: ">",
  save: "S",
  search: "?",
  send: ">",
  settings: "*",
  "shield-alert": "!",
  siren: "!",
  truck: "T",
  users: "U",
  x: "x"
};

const elements = {
  content: document.querySelector("#content"),
  messageArea: document.querySelector("#messageArea"),
  pageTitle: document.querySelector("#pageTitle"),
  brandName: document.querySelector("#brandName"),
  tenantSelect: document.querySelector("#tenantSelect"),
  roleSelect: document.querySelector("#roleSelect"),
  globalSearch: document.querySelector("#globalSearch"),
  freightDialog: document.querySelector("#freightDialog"),
  freightForm: document.querySelector("#freightForm"),
  driverDialog: document.querySelector("#driverDialog"),
  driverForm: document.querySelector("#driverForm"),
  incidentDialog: document.querySelector("#incidentDialog"),
  incidentForm: document.querySelector("#incidentForm"),
  incidentTripSelect: document.querySelector("#incidentTripSelect"),
  toast: document.querySelector("#toast")
};

function money(value) {
  return formatter.format(Number(value || 0));
}

function labelFrom(map, value) {
  return map[value] || value || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(status) {
  if (["DOCUMENT_PENDING", "INCIDENT", "CANCELLED"].includes(status)) return "danger";
  if (["NEGOTIATING", "DOCUMENTATION", "SETTLEMENT_PENDING"].includes(status)) return "warning";
  return "";
}

function idempotencyKey(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": state.tenantId,
      "x-role": state.role,
      ...(options.headers || {})
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Falha na API local");
  }
  return payload;
}

async function optionalApi(path, fallback) {
  try {
    return await api(path);
  } catch (error) {
    return fallback;
  }
}

function can(permission) {
  const permissions = state.bootstrap?.roles?.[state.role]?.permissions || [];
  return permissions.includes("*") || permissions.includes(permission);
}

function toast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toast.timeout);
  toast.timeout = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
}

function showNotice(message) {
  elements.messageArea.innerHTML = message
    ? `<div class="notice"><i data-lucide="info"></i>${escapeHtml(message)}</div>`
    : "";
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    return;
  }

  document.querySelectorAll("i[data-lucide]").forEach((icon) => {
    if (icon.dataset.iconReady === "true") return;
    icon.classList.add("fallback-icon");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = fallbackIcons[icon.dataset.lucide] || "*";
    icon.dataset.iconReady = "true";
  });
}

function setBrand(brand) {
  if (!brand) return;
  document.documentElement.style.setProperty("--primary", brand.primaryColor || "#0f5f63");
  document.documentElement.style.setProperty("--accent", brand.accentColor || "#f97316");
  elements.brandName.textContent = brand.appName || "R2R Logística";
}

function syncChromePermissions() {
  document.querySelector("#newFreightButton").hidden = !can("freight:create");
  document.querySelector("#newDriverButton").hidden = !can("driver:create");
  document.querySelector("#incidentButton").hidden = !can("incident:create");
}

function renderSelects() {
  elements.tenantSelect.innerHTML = state.bootstrap.tenants
    .map((tenant) => `<option value="${tenant.id}">${escapeHtml(tenant.name)}</option>`)
    .join("");
  elements.tenantSelect.value = state.tenantId;

  elements.roleSelect.innerHTML = Object.entries(state.bootstrap.roles)
    .map(([key, role]) => `<option value="${key}">${escapeHtml(role.label)}</option>`)
    .join("");
  elements.roleSelect.value = state.role;
}

async function loadAll() {
  const [dashboard, freights, trips, fiscal, finance, offers, contracts, incidents, risk, audit] = await Promise.all([
    optionalApi("/api/dashboard", {}),
    can("freight:read")
      ? optionalApi(`/api/freights?q=${encodeURIComponent(state.query)}&status=${state.statusFilter}&priority=${state.priorityFilter}`, [])
      : [],
    can("trip:read") ? optionalApi("/api/trips", []) : [],
    can("fiscal:read") ? optionalApi("/api/fiscal", []) : [],
    can("finance:read") ? optionalApi("/api/finance", []) : [],
    can("freight:read") ? optionalApi("/api/offers", []) : [],
    can("trip:read") ? optionalApi("/api/contracts", []) : [],
    can("trip:read") ? optionalApi("/api/incidents", []) : [],
    optionalApi("/api/risk", []),
    optionalApi("/api/audit", [])
  ]);

  state.dashboard = dashboard;
  state.freights = freights;
  state.trips = trips;
  state.fiscal = fiscal;
  state.finance = finance;
  state.offers = offers;
  state.contracts = contracts;
  state.incidents = incidents;
  state.risk = risk;
  state.audit = audit;

  if (!freights.some((freight) => freight.id === state.selectedFreightId)) {
    state.selectedFreightId = freights[0]?.id || "";
  }
  if (!trips.some((trip) => trip.id === state.selectedTripId)) {
    state.selectedTripId = trips[0]?.id || "";
  }

  await loadDrivers();
}

async function loadDrivers() {
  if (!can("driver:read")) {
    state.drivers = [];
    return;
  }
  const query = state.selectedFreightId ? `?freightId=${encodeURIComponent(state.selectedFreightId)}` : "";
  state.drivers = await api(`/api/drivers${query}`);
}

function render() {
  elements.pageTitle.textContent = views[state.view];
  syncChromePermissions();
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });

  const activeTenant = state.bootstrap.tenants.find((tenant) => tenant.id === state.tenantId);
  setBrand(activeTenant?.brand);

  if (state.view === "control") renderControl();
  if (state.view === "marketplace") renderMarketplace();
  if (state.view === "matching") renderMatching();
  if (state.view === "trips") renderTrips();
  if (state.view === "fiscal") renderFiscal();
  if (state.view === "finance") renderFinance();
  if (state.view === "admin") renderAdmin();
  refreshIcons();
}

function kpi(label, value, trend) {
  return `
    <article class="kpi-card">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(trend)}</span>
    </article>
  `;
}

function renderKpis() {
  const d = {
    openFreights: 0,
    driversAvailable: 0,
    activeTrips: 0,
    delayedTrips: 0,
    fiscalPending: 0,
    revenue: 0,
    otif: 100,
    ...state.dashboard
  };
  return `
    <section class="kpi-grid">
      ${kpi("Fretes abertos", d.openFreights, `${d.driversAvailable} motoristas disponíveis`)}
      ${kpi("Viagens ativas", d.activeTrips, `${d.delayedTrips} com alerta`)}
      ${kpi("Pendências fiscais", d.fiscalPending, "CT-e, MDF-e, CIOT")}
      ${kpi("Receita monitorada", money(d.revenue), `${d.otif}% OTIF`)}
    </section>
  `;
}

function renderControl() {
  const pins = state.trips.slice(0, 3);
  elements.content.innerHTML = `
    ${renderKpis()}
    <section class="two-column">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Mapa operacional</p>
            <h2>Cargas, veículos e alertas em tempo real</h2>
          </div>
          <button class="secondary-button" type="button" data-action="refresh">
            <i data-lucide="refresh-cw"></i>
            Atualizar
          </button>
        </div>
        <div class="control-map" aria-label="Mapa operacional">
          <div class="route-line"></div>
          ${pins
            .map(
              (trip, index) => `
                <div class="map-pin pin-${index + 1}">
                  <strong>${escapeHtml(trip.vehiclePlate)}</strong>
                  <small>${escapeHtml(statusLabels[trip.status] || trip.status)}</small>
                  <small>${escapeHtml(trip.lastPing.city)}/${escapeHtml(trip.lastPing.uf)} ${escapeHtml(trip.lastPing.at)}</small>
                </div>
              `
            )
            .join("")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Fila crítica</p>
            <h2>Operações para decidir</h2>
          </div>
        </div>
        <div class="lane-list">
          ${state.freights.slice(0, 4).map(renderFreightCard).join("") || empty("Nenhum frete encontrado")}
        </div>
      </div>
    </section>
  `;
}

function renderFreightCard(freight) {
  const matchingButton = can("driver:read")
    ? `
        <button class="secondary-button" type="button" data-select-freight="${freight.id}" data-target-view="matching">
          <i data-lucide="route"></i>
          Ver alocação
        </button>
      `
    : "";

  return `
    <article class="record-card">
      <div class="record-topline">
        <strong>${escapeHtml(freight.id)}</strong>
        <span class="status-pill ${statusClass(freight.status)}">${escapeHtml(statusLabels[freight.status] || freight.status)}</span>
      </div>
      <div>
        <h3>${escapeHtml(freight.origin.city)}/${escapeHtml(freight.origin.uf)} → ${escapeHtml(freight.destination.city)}/${escapeHtml(freight.destination.uf)}</h3>
        <p class="muted">${escapeHtml(freight.cargo)} · ${numberFormatter.format(freight.weightKg)} kg · ${escapeHtml(labelFrom(bodyLabels, freight.requiredBody))}</p>
      </div>
      <div class="tag-row">
        <span class="tag">${money(freight.price)}</span>
        <span class="tag">${numberFormatter.format(freight.distanceKm)} km</span>
        <span class="risk-pill ${freight.riskScore >= 50 ? "medio" : "baixo"}">Risco ${freight.riskScore}</span>
      </div>
      <div class="record-actions">
        ${matchingButton}
      </div>
    </article>
  `;
}

function renderMarketplace() {
  elements.content.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Fretes publicados</p>
          <h2>Busca e contratação</h2>
        </div>
        ${
          can("freight:create")
            ? `<button class="primary-button" type="button" data-action="open-freight">
                <i data-lucide="plus"></i>
                Publicar
              </button>`
            : ""
        }
      </div>
      <div class="filters">
        <select id="statusFilter" class="select">
          ${filterOption("all", "Todos os status", state.statusFilter)}
          ${Object.entries(statusLabels).map(([key, label]) => filterOption(key, label, state.statusFilter)).join("")}
        </select>
        <select id="priorityFilter" class="select">
          ${filterOption("all", "Todas as prioridades", state.priorityFilter)}
          ${filterOption("alta", "Alta", state.priorityFilter)}
          ${filterOption("media", "Media", state.priorityFilter)}
          ${filterOption("baixa", "Baixa", state.priorityFilter)}
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Frete</th>
              <th>Rota</th>
              <th>Carga</th>
              <th>Coleta</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            ${state.freights
              .map(
                (freight) => `
                  <tr>
                    <td><strong>${escapeHtml(freight.id)}</strong><br /><span class="muted">${escapeHtml(freight.shipper)}</span></td>
                    <td>${escapeHtml(freight.origin.city)}/${escapeHtml(freight.origin.uf)}<br />${escapeHtml(freight.destination.city)}/${escapeHtml(freight.destination.uf)}</td>
                    <td>${escapeHtml(freight.cargo)}<br /><span class="muted">${numberFormatter.format(freight.weightKg)} kg · ${escapeHtml(labelFrom(vehicleLabels, freight.requiredVehicle))}</span></td>
                    <td>${escapeHtml(freight.pickupWindow)}<br /><span class="muted">Previsão ${escapeHtml(freight.deliveryEta)}</span></td>
                    <td><strong>${money(freight.price)}</strong><br /><span class="muted">Custo ${money(freight.estimate.subtotal)}</span></td>
                    <td><span class="status-pill ${statusClass(freight.status)}">${escapeHtml(statusLabels[freight.status] || freight.status)}</span></td>
                    <td>
                      ${
                        can("driver:read")
                          ? `<button class="secondary-button" type="button" data-select-freight="${freight.id}" data-target-view="matching">
                              <i data-lucide="users"></i>
                              Motoristas
                            </button>`
                          : `<span class="muted">Somente leitura</span>`
                      }
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  document.querySelector("#statusFilter").addEventListener("change", async (event) => {
    state.statusFilter = event.target.value;
    await refreshAndRender();
  });
  document.querySelector("#priorityFilter").addEventListener("change", async (event) => {
    state.priorityFilter = event.target.value;
    await refreshAndRender();
  });
}

function filterOption(value, label, activeValue) {
  return `<option value="${value}" ${activeValue === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function renderMatching() {
  const selected = state.freights.find((freight) => freight.id === state.selectedFreightId) || state.freights[0];
  if (!selected) {
    elements.content.innerHTML = empty("Cadastre uma carga para iniciar a alocação inteligente.");
    return;
  }

  const driverList = can("driver:read")
    ? state.drivers.map((driver) => renderDriverCard(driver, selected)).join("") || empty("Nenhum motorista compatível.")
    : empty("Este perfil pode acompanhar cargas, mas não acessa o ranking de motoristas.");
  const offers = state.offers.filter((offer) => offer.freightId === selected.id);

  elements.content.innerHTML = `
    <section class="two-column">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Carga selecionada</p>
            <h2>${escapeHtml(selected.id)} · ${escapeHtml(selected.origin.city)} para ${escapeHtml(selected.destination.city)}</h2>
          </div>
          <select id="freightSelect" class="select">
            ${state.freights.map((freight) => filterOption(freight.id, `${freight.id} - ${freight.origin.city}/${freight.origin.uf}`, selected.id)).join("")}
          </select>
        </div>
        ${renderFreightCard(selected)}
        <div class="finance-grid" style="margin-top: 12px;">
          <div class="finance-card"><small class="muted">Preço sugerido</small><strong>${money(selected.estimate.suggestedPrice)}</strong></div>
          <div class="finance-card"><small class="muted">Custo por km</small><strong>${money(selected.estimate.costPerKm)}</strong></div>
          <div class="finance-card"><small class="muted">Pedágios</small><strong>${money(selected.tolls)}</strong></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Ranking</p>
            <h2>Motoristas recomendados</h2>
          </div>
        </div>
        <div class="driver-list">
          ${driverList}
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Negociação</p>
          <h2>Propostas e contratação</h2>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Proposta</th>
              <th>Motorista</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Mensagem</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            ${
              offers.length
                ? offers.map(renderOfferRow).join("")
                : `<tr><td colspan="6">${empty("Nenhuma proposta enviada para esta carga.")}</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;

  document.querySelector("#freightSelect").addEventListener("change", async (event) => {
    state.selectedFreightId = event.target.value;
    await loadDrivers();
    render();
  });
}

function renderOfferRow(offer) {
  return `
    <tr>
      <td><strong>${escapeHtml(offer.id)}</strong></td>
      <td>${escapeHtml(offer.driverName)}</td>
      <td>${money(offer.amount)}</td>
      <td><span class="status-pill ${offer.status === "sent" ? "warning" : ""}">${escapeHtml(labelFrom(offerStatusLabels, offer.status))}</span></td>
      <td>${escapeHtml(offer.message)}</td>
      <td>
        ${
          offer.status === "sent" && can("contract:create")
            ? `<button class="primary-button" type="button" data-contract-offer="${offer.id}">
                <i data-lucide="badge-check"></i>
                Contratar
              </button>`
            : `<span class="muted">Registrada</span>`
        }
      </td>
    </tr>
  `;
}

function renderDriverCard(driver, freight) {
  const offerAmount = Math.max(freight.price, freight.estimate.suggestedPrice);
  const canSendOffer = can("freight:negotiate") || can("offer:create");
  return `
    <article class="record-card driver-card">
      <div class="driver-score" style="--score: ${driver.matchScore || 0};">${driver.matchScore || "--"}%</div>
      <div>
        <div class="record-topline">
          <strong>${escapeHtml(driver.name)}</strong>
          <span class="risk-pill ${driver.riskScore >= 50 ? "medio" : "baixo"}">Risco ${driver.riskScore}</span>
        </div>
        <p class="muted">${escapeHtml(driver.city)}/${escapeHtml(driver.uf)} · ${driver.distanceToPickupKm} km da coleta · ${escapeHtml(driver.vehiclePlate)}</p>
        <div class="tag-row">
          <span class="tag">${escapeHtml(labelFrom(documentStatusLabels, driver.documentsStatus))}</span>
          <span class="tag">${escapeHtml(labelFrom(rntrcStatusLabels, driver.rntrcStatus))}</span>
          <span class="tag">Nota ${driver.rating}</span>
        </div>
        <div class="record-actions" style="margin-top: 10px;">
          ${
            canSendOffer
              ? `<button class="primary-button" type="button" data-offer-driver="${driver.id}" data-offer-amount="${offerAmount}">
                  <i data-lucide="handshake"></i>
                  Enviar proposta
                </button>`
              : `<span class="muted">Sem permissão para proposta</span>`
          }
        </div>
      </div>
    </article>
  `;
}

function renderTrips() {
  elements.content.innerHTML = `
    <section class="trip-grid">
      ${state.trips.map(renderTripStage).join("") || empty("Nenhuma viagem cadastrada.")}
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Histórico da viagem</p>
          <h2>${escapeHtml(state.selectedTripId || "Selecione uma viagem")}</h2>
        </div>
      </div>
      ${renderTimeline()}
    </section>
  `;
}

function renderTripStage(trip) {
  const nextStatus = nextByStatus[trip.status];
  const hasAlert = trip.alerts.length > 0;
  return `
    <article class="tracking-stage">
      <div class="record-topline">
        <strong>${escapeHtml(trip.id)}</strong>
        <span class="status-pill ${hasAlert ? "warning" : statusClass(trip.status)}">${escapeHtml(statusLabels[trip.status] || trip.status)}</span>
      </div>
      <p class="muted">${escapeHtml(trip.route)} · ${escapeHtml(trip.vehiclePlate)}</p>
      <div class="progress-track" aria-label="Progresso da viagem">
        <span style="width: ${trip.progress}%"></span>
      </div>
      <p class="muted" style="margin-top: 10px;">Último ping: ${escapeHtml(trip.lastPing.city)}/${escapeHtml(trip.lastPing.uf)} · ${escapeHtml(trip.lastPing.at)}</p>
      ${trip.alerts.map((alert) => `<p class="notice">${escapeHtml(alert.text)}</p>`).join("")}
      <div class="record-actions">
        <button class="secondary-button" type="button" data-select-trip="${trip.id}">
          <i data-lucide="list-checks"></i>
          Histórico
        </button>
        ${
          nextStatus
            ? `<button class="primary-button" type="button" data-advance-trip="${trip.id}" data-next-status="${nextStatus}">
                <i data-lucide="arrow-right"></i>
                ${escapeHtml(statusLabels[nextStatus])}
              </button>`
            : ""
        }
        ${
          can("tracking:write")
            ? `<button class="secondary-button" type="button" data-ping-trip="${trip.id}">
                <i data-lucide="map-pinned"></i>
                Ping
              </button>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderTimeline() {
  const trip = state.trips.find((item) => item.id === state.selectedTripId) || state.trips[0];
  if (!trip) return empty("Sem histórico.");

  return `
    <div class="timeline">
      ${trip.timeline
        .map(
          (event) => `
            <div class="timeline-item">
              <time>${escapeHtml(event.at)}</time>
              <div>
                <strong>${escapeHtml(statusLabels[event.status] || event.status)}</strong>
                <p class="muted">${escapeHtml(event.text)}</p>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderFiscal() {
  elements.content.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Homologação fiscal</p>
          <h2>CT-e, MDF-e, CIOT e Vale-Pedágio</h2>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Documento</th>
              <th>Viagem</th>
              <th>Chave</th>
              <th>Ambiente</th>
              <th>Status</th>
              <th>Protocolo</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            ${state.fiscal
              .map(
                (doc) => `
                  <tr>
                    <td><strong>${escapeHtml(doc.type)}</strong><br /><span class="muted">${escapeHtml(doc.id)}</span></td>
                    <td>${escapeHtml(doc.tripId)}</td>
                    <td>${escapeHtml(doc.key)}</td>
                    <td>${escapeHtml(labelFrom(environmentLabels, doc.environment))}</td>
                    <td><span class="status-pill ${doc.status === "authorized" ? "" : "warning"}">${escapeHtml(labelFrom(fiscalStatusLabels, doc.status))}</span></td>
                    <td>${escapeHtml(doc.protocol || "Aguardando")}</td>
                    <td>
                      ${
                        doc.status !== "authorized" && can("fiscal:write")
                          ? `<button class="primary-button" type="button" data-authorize-doc="${doc.id}">
                              <i data-lucide="file-check-2"></i>
                              Autorizar
                            </button>`
                          : `<span class="muted">Sem ação</span>`
                      }
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">Regra de segurança</p>
      <h2>Integrações oficiais ficam desacopladas</h2>
      <p class="muted">Este MVP registra estados e estrutura de documentos em homologação. Em produção, certificados digitais, SEFAZ, ANTT, CIOT, RNTRC e provedores de Vale-Pedágio devem usar cofres de segredo, auditoria e idempotência.</p>
    </section>
  `;
}

function renderFinance() {
  const total = state.finance.reduce((sum, payment) => sum + payment.amount, 0);
  const paid = state.finance.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amount, 0);
  const pending = total - paid;

  elements.content.innerHTML = `
    <section class="finance-grid">
      <article class="finance-card"><small class="muted">Valor movimentado</small><strong>${money(total)}</strong></article>
      <article class="finance-card"><small class="muted">Liquidado</small><strong>${money(paid)}</strong></article>
      <article class="finance-card"><small class="muted">Protegido ou pendente</small><strong>${money(pending)}</strong></article>
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Pagamentos</p>
          <h2>Controle com idempotência</h2>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Viagem</th>
              <th>Método</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Idempotência</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            ${state.finance
              .map(
                (payment) => `
                  <tr>
                    <td><strong>${escapeHtml(payment.id)}</strong></td>
                    <td>${escapeHtml(payment.tripId)}</td>
                    <td>${escapeHtml(labelFrom(paymentMethodLabels, payment.method))}</td>
                    <td>${money(payment.amount)}</td>
                    <td><span class="status-pill ${payment.status === "pending" ? "warning" : ""}">${escapeHtml(labelFrom(paymentStatusLabels, payment.status))}</span></td>
                    <td>${escapeHtml(payment.idempotencyKey)}</td>
                    <td>
                      ${
                        payment.status !== "paid" && can("finance:settle")
                          ? `<button class="primary-button" type="button" data-settle-payment="${payment.id}">
                              <i data-lucide="landmark"></i>
                              Liquidar
                            </button>`
                          : `<span class="muted">Liquidado</span>`
                      }
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAdmin() {
  const tenant = state.bootstrap.tenants.find((item) => item.id === state.tenantId);
  const adminControls = can("brand:update")
    ? `
        <form id="brandForm" class="form-grid">
          <label>
            Nome da plataforma
            <input name="appName" value="${escapeHtml(tenant.brand.appName)}" />
          </label>
          <label>
            Cor principal
            <input name="primaryColor" type="color" value="${escapeHtml(tenant.brand.primaryColor)}" />
          </label>
          <label>
            Cor de ação
            <input name="accentColor" type="color" value="${escapeHtml(tenant.brand.accentColor)}" />
          </label>
          <div class="span-2">
            <button class="primary-button" type="submit">
              <i data-lucide="save"></i>
              Salvar marca
            </button>
          </div>
        </form>
      `
    : empty("Este perfil visualiza auditoria, mas não altera configurações da empresa.");

  elements.content.innerHTML = `
    <section class="admin-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Empresas isoladas</p>
            <h2>Identidade parametrizável</h2>
          </div>
        </div>
        ${adminControls}
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Auditoria</p>
            <h2>Eventos recentes</h2>
          </div>
        </div>
        <div class="audit-list">
          ${state.audit
            .map(
              (item) => `
                <article class="record-card">
                  <strong>${escapeHtml(labelFrom(auditActionLabels, item.action))}</strong>
                  <span class="muted">${escapeHtml(labelFrom(auditEntityLabels, item.entity))} · ${new Date(item.at).toLocaleString("pt-BR")}</span>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;

  document.querySelector("#brandForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const brand = await api("/api/brand", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      const currentTenant = state.bootstrap.tenants.find((item) => item.id === state.tenantId);
      currentTenant.brand = brand;
      setBrand(brand);
      toast("Marca atualizada para esta empresa.");
    } catch (error) {
      showNotice(error.message);
    }
  });
}

function empty(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

async function refreshAndRender() {
  showNotice("");
  try {
    await loadAll();
    render();
  } catch (error) {
    showNotice(error.message);
  }
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  elements.tenantSelect.addEventListener("change", async (event) => {
    state.tenantId = event.target.value;
    localStorage.setItem("r2r.tenantId", state.tenantId);
    state.selectedFreightId = "";
    state.selectedTripId = "";
    await refreshAndRender();
  });

  elements.roleSelect.addEventListener("change", async (event) => {
    state.role = event.target.value;
    localStorage.setItem("r2r.role", state.role);
    await refreshAndRender();
  });

  elements.globalSearch.addEventListener("input", async (event) => {
    state.query = event.target.value;
    state.statusFilter = "all";
    window.clearTimeout(elements.globalSearch.timeout);
    elements.globalSearch.timeout = window.setTimeout(refreshAndRender, 180);
  });

  document.querySelector("#newFreightButton").addEventListener("click", () => elements.freightDialog.showModal());
  document.querySelector("#newDriverButton").addEventListener("click", () => elements.driverDialog.showModal());
  document.querySelector("#incidentButton").addEventListener("click", () => {
    fillIncidentTrips();
    elements.incidentDialog.showModal();
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`).close());
  });

  elements.freightForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.idempotencyKey = idempotencyKey("freight");
    try {
      await api("/api/freights", {
        method: "POST",
        headers: { "Idempotency-Key": payload.idempotencyKey },
        body: JSON.stringify(payload)
      });
      elements.freightDialog.close();
      state.view = "marketplace";
      toast("Carga publicada e enviada ao mercado de fretes.");
      await refreshAndRender();
    } catch (error) {
      showNotice(error.message);
    }
  });

  elements.driverForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formEntries = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = {
      ...formEntries,
      vehicleTypes: [formEntries.vehicleType],
      bodyTypes: [formEntries.bodyType],
      previousRoutes: [formEntries.uf, "SP", "MG"],
      idempotencyKey: idempotencyKey("driver")
    };
    try {
      await api("/api/drivers", {
        method: "POST",
        headers: { "Idempotency-Key": payload.idempotencyKey },
        body: JSON.stringify(payload)
      });
      elements.driverDialog.close();
      state.view = "matching";
      toast("Motorista cadastrado e disponível para alocação.");
      await refreshAndRender();
    } catch (error) {
      showNotice(error.message);
    }
  });

  elements.incidentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api("/api/incidents", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      elements.incidentDialog.close();
      state.view = "trips";
      toast("Ocorrência registrada na torre.");
      await refreshAndRender();
    } catch (error) {
      showNotice(error.message);
    }
  });

  elements.content.addEventListener("click", async (event) => {
    try {
      const freightButton = event.target.closest("[data-select-freight]");
      if (freightButton) {
        state.selectedFreightId = freightButton.dataset.selectFreight;
        state.view = freightButton.dataset.targetView || "matching";
        await loadDrivers();
        render();
        return;
      }

      const tripButton = event.target.closest("[data-select-trip]");
      if (tripButton) {
        state.selectedTripId = tripButton.dataset.selectTrip;
        render();
        return;
      }

      const offerButton = event.target.closest("[data-offer-driver]");
      if (offerButton) {
        const selected = state.freights.find((freight) => freight.id === state.selectedFreightId);
        const offer = await api("/api/offers", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey("offer") },
          body: JSON.stringify({
            freightId: selected.id,
            driverId: offerButton.dataset.offerDriver,
            amount: Number(offerButton.dataset.offerAmount),
            message: "Proposta enviada com base na alocação inteligente"
          })
        });
        toast(`Proposta ${offer.id} enviada.`);
        await refreshAndRender();
        return;
      }

      const contractButton = event.target.closest("[data-contract-offer]");
      if (contractButton) {
        const result = await api("/api/contracts", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey("contract") },
          body: JSON.stringify({
            offerId: contractButton.dataset.contractOffer
          })
        });
        state.selectedTripId = result.trip.id;
        state.view = "trips";
        toast(`Contrato ${result.contract.id} criado e viagem aberta.`);
        await refreshAndRender();
        return;
      }

      const advanceButton = event.target.closest("[data-advance-trip]");
      if (advanceButton) {
        const trip = await api(`/api/trips/${advanceButton.dataset.advanceTrip}/advance`, {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey("advance") },
          body: JSON.stringify({
            targetStatus: advanceButton.dataset.nextStatus,
            note: statusLabels[advanceButton.dataset.nextStatus]
          })
        });
        state.selectedTripId = trip.id;
        toast("Status da viagem atualizado.");
        await refreshAndRender();
        return;
      }

      const pingButton = event.target.closest("[data-ping-trip]");
      if (pingButton) {
        const trip = state.trips.find((item) => item.id === pingButton.dataset.pingTrip);
        const updated = await api("/api/tracking/ping", {
          method: "POST",
          body: JSON.stringify({
            tripId: trip.id,
            city: trip.lastPing.city,
            uf: trip.lastPing.uf,
            speed: Math.max(48, trip.lastPing.speed || 64),
            progress: Math.min(100, trip.progress + 8)
          })
        });
        state.selectedTripId = updated.id;
        toast("Ping de rastreamento registrado.");
        await refreshAndRender();
        return;
      }

      const authorizeButton = event.target.closest("[data-authorize-doc]");
      if (authorizeButton) {
        await api("/api/fiscal/authorize", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey("fiscal") },
          body: JSON.stringify({
            documentId: authorizeButton.dataset.authorizeDoc
          })
        });
        toast("Documento autorizado em homologação.");
        await refreshAndRender();
        return;
      }

      const settleButton = event.target.closest("[data-settle-payment]");
      if (settleButton) {
        await api(`/api/payments/${settleButton.dataset.settlePayment}/settle`, {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey("payment") },
          body: JSON.stringify({})
        });
        toast("Pagamento liquidado.");
        await refreshAndRender();
        return;
      }

      const actionButton = event.target.closest("[data-action]");
      if (actionButton?.dataset.action === "open-freight") {
        elements.freightDialog.showModal();
      }
      if (actionButton?.dataset.action === "refresh") {
        await refreshAndRender();
        toast("Painel atualizado.");
      }
    } catch (error) {
      showNotice(error.message);
    }
  });
}

function fillIncidentTrips() {
  elements.incidentTripSelect.innerHTML = state.trips
    .map((trip) => `<option value="${trip.id}">${escapeHtml(trip.id)} - ${escapeHtml(trip.route)}</option>`)
    .join("");
}

async function boot() {
  try {
    state.bootstrap = await api("/api/bootstrap");
    if (!state.tenantId) {
      state.tenantId = state.bootstrap.tenant.id;
    }
    renderSelects();
    bindEvents();
    await loadAll();
    render();
    showNotice("");
  } catch (error) {
    elements.content.innerHTML = empty("Inicie a API local com npm start para carregar o sistema.");
    showNotice(error.message);
  }
}

boot();
