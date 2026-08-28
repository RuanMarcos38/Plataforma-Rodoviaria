# Matriz Funcional

| Area | MVP atual | Proxima etapa |
| --- | --- | --- |
| Multi-tenant | Selecao e isolamento por tenant na API | Banco com policies por tenant |
| RBAC | Perfis e permissoes em dominio | Autenticacao e sessoes reais |
| Marketplace | Lista, filtro e publicacao de fretes | Cotacoes, anexos e SLA |
| Matching | Ranking de motoristas por carga | IA, historico real e geolocalizacao |
| Propostas | Envio, listagem e contratacao idempotente | Contraproposta e chat |
| Viagens | State machine, timeline e ping de tracking | Tracking real, geofence e ETA |
| Fiscal | Estrutura CT-e, MDF-e, CIOT e autorizacao em homologacao | Integracoes oficiais homologadas |
| Regulatório | Campos para RNTRC, CIOT e pedagio | Consultas oficiais e versionamento |
| Financeiro | Pagamentos, liquidacao e status | Provider real, split, escrow e conciliação |
| Risco | Score e findings | OCR, biometria, device check e seguradora |
| Admin | Marca por tenant e auditoria | Planos, usuarios, billing e suporte |
| Persistencia | Arquivo JSON local ignorado pelo Git | PostgreSQL + PostGIS isolado |
| Testes | Testes de dominio e HTTP end-to-end | E2E em navegador e carga |
