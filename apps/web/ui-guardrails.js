(() => {
  const originalRender = render;

  function hasValue(object, key) {
    return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key) && object[key] !== null && object[key] !== undefined;
  }

  function emptyMarkup(message) {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";
    wrapper.setAttribute("role", "status");

    const icon = document.createElement("i");
    icon.dataset.lucide = "info";
    icon.setAttribute("aria-hidden", "true");

    const content = document.createElement("div");
    const title = document.createElement("strong");
    const text = document.createElement("span");
    title.textContent = "Sem dados disponíveis";
    text.textContent = message;
    content.append(title, text);
    wrapper.append(icon, content);
    return wrapper;
  }

  function enhanceExistingEmptyStates() {
    document.querySelectorAll(".empty-state").forEach((node) => {
      if (node.querySelector("strong")) return;
      const message = node.textContent.trim() || "Nenhuma informação disponível no momento.";
      node.replaceWith(emptyMarkup(message));
    });
  }

  function updateNavigationState() {
    document.querySelectorAll(".nav-button").forEach((button) => {
      const active = button.dataset.view === state.view;
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function guardDashboardMetrics() {
    if (state.view !== "control") return;

    const dashboard = state.dashboard || {};
    const grid = elements.content.querySelector(".kpi-grid");
    if (grid) {
      const cards = Array.from(grid.children);
      const rules = [
        { key: "openFreights", detail: "driversAvailable" },
        { key: "activeTrips", detail: "delayedTrips" },
        { key: "fiscalPending" },
        { key: "revenue", detail: "otif" }
      ];

      rules.forEach((rule, index) => {
        const card = cards[index];
        if (!card) return;
        if (!hasValue(dashboard, rule.key)) {
          card.remove();
          return;
        }
        if (rule.detail && !hasValue(dashboard, rule.detail)) {
          card.querySelector("span")?.remove();
        }
      });

      if (!grid.children.length) {
        const panel = document.createElement("section");
        panel.className = "panel data-unavailable";
        panel.append(emptyMarkup("Os indicadores aparecerão quando a integração atual disponibilizar dados."));
        grid.replaceWith(panel);
      }
    }

    const panelTitle = elements.content.querySelector(".two-column .panel h2");
    const panelEyebrow = elements.content.querySelector(".two-column .panel .eyebrow");
    if (panelTitle) panelTitle.textContent = "Últimas posições e status recebidos";
    if (panelEyebrow) panelEyebrow.textContent = "Rastreamento operacional";

    const tracking = elements.content.querySelector(".control-map");
    tracking?.querySelector(".route-line")?.remove();
    if (tracking && !state.trips.length) {
      tracking.replaceChildren(emptyMarkup("Nenhuma posição de rastreamento disponível no momento."));
    }
  }

  function guardTableEmptyState() {
    const messages = {
      marketplace: "Nenhum frete encontrado com os filtros atuais.",
      fiscal: "Nenhum documento fiscal disponível na integração atual."
    };
    const message = messages[state.view];
    if (!message) return;

    elements.content.querySelectorAll("table").forEach((table) => {
      const tbody = table.tBodies[0];
      if (!tbody || tbody.rows.length) return;
      const row = tbody.insertRow();
      row.className = "empty-row";
      const cell = row.insertCell();
      cell.colSpan = Math.max(1, table.tHead?.rows[0]?.cells.length || 1);
      cell.append(emptyMarkup(message));
    });
  }

  function guardFinance() {
    if (state.view !== "finance" || state.finance.length) return;
    elements.content.replaceChildren();
    const panel = document.createElement("section");
    panel.className = "panel data-unavailable";
    const header = document.createElement("div");
    header.className = "panel-header";
    header.innerHTML = '<div><p class="eyebrow">Financeiro</p><h2>Pagamentos e liquidações</h2></div>';
    panel.append(header, emptyMarkup("Nenhum dado financeiro disponível na integração atual."));
    elements.content.append(panel);
  }

  function guardAudit() {
    if (state.view !== "admin" || state.audit.length) return;
    const auditList = elements.content.querySelector(".audit-list");
    if (auditList && !auditList.children.length) {
      auditList.append(emptyMarkup("Nenhum evento de auditoria disponível."));
    }
  }

  function applyUiGuardrails() {
    updateNavigationState();
    guardDashboardMetrics();
    guardTableEmptyState();
    guardFinance();
    guardAudit();
    enhanceExistingEmptyStates();
    refreshIcons();
  }

  render = function renderWithUiGuardrails() {
    originalRender();
    applyUiGuardrails();
  };
})();
