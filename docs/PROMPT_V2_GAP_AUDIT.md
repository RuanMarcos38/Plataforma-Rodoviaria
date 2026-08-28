# Auditoria Prompt Mestre V2 — Plataforma Rodoviária

Data da baseline: 28/08/2026
Base auditada: `main` no commit `79dd12d16965c2c933375f201db81282f808846b`
Branch de evolução: `feat/prompt-v2-audit-foundation-20260828`

## Regra de precedência

O frontend aprovado é baseline congelada. Este lote não pode modificar arquivos em `apps/web/`. Evoluções funcionais devem preservar rotas, payloads, IDs, classes, `data-*`, eventos, navegação global, layout, CSS e comportamento já consumido.

Baseline visual registrada no repositório:

- `apps/web/index.html` — blob `842701a356ce5439eb3fed0a40ddf67d39fdcef4`
- `apps/web/app.js` — blob `d931b0e3674f3a5401ca61183010c53adfeef344`
- `apps/web/styles.css` — blob `d48626560bd9e32c1028414385ad9899a6f653e0`
- `apps/web/premium.css` — blob `40ef8fa08e35817aada10c71156b838e3f8e65f1`
- `apps/web/responsive-qa.css` — blob `188c035c0b0a5f19ae49203242adb2868ef2137a`
- `apps/web/logimax-reference.css` — blob `1cc07c3ed8aa96a22e52e240ccccf84048c97dd9`

A navegação global existente permanece: Torre, Mercado, Alocação, Viagens, Fiscal, Financeiro e Administração.

## Inventário técnico atual

| Camada | Evidência atual | Classificação |
| --- | --- | --- |
| Runtime | Node.js >= 20, sem dependências externas obrigatórias | PRESERVAR |
| Frontend | HTML/CSS/JavaScript em `apps/web`, identidade LogiMax aprovada | PRESERVAR |
| API | HTTP Node em `apps/api/server.js`, rotas `/api/*` | PRESERVAR/COMPLETAR |
| Domínio | `calculations.js`, `rbac.js`, `status-machine.js`, `store.js`, `seed-data.js` | PRESERVAR/COMPLETAR |
| Persistência | Arquivo JSON local por `createFileStore` | PARCIAL — somente desenvolvimento |
| Multi-tenant | `tenantId`, header `x-tenant-id`, filtros por tenant na API | PARCIAL |
| RBAC | Perfis e permissões no domínio, autorização no backend | PARCIAL |
| Autenticação | Não há usuário/sessão real; perfil é recebido por header | AUSENTE |
| Testes | Domínio + HTTP E2E local | PARCIAL |
| Healthcheck | `/api/health` | PARCIAL |
| CI/regressão visual | Criado neste lote com screenshots e bloqueio de alteração de `apps/web` | COMPLETAR |

## Contratos existentes que não podem ser quebrados

Rotas identificadas no backend atual:

- `GET /api/health`
- `GET /api/bootstrap`
- `GET /api/dashboard`
- `GET|POST /api/freights`
- `GET|POST /api/drivers`
- `GET|POST /api/offers`
- `GET|POST /api/contracts`
- `GET /api/trips`
- `POST /api/trips/:id/advance`
- `POST /api/tracking/ping`
- `GET /api/fiscal`
- `POST /api/fiscal/authorize`
- `GET /api/finance`
- `POST /api/payments/:id/settle`
- `GET /api/risk`
- `GET|POST /api/incidents`
- `POST /api/brand`
- `GET /api/audit`

Novas APIs devem ser adicionadas sem renomear ou remover esses contratos. Quando forem públicas/novas, preferir `/api/v1/...`.

## Matriz de gaps do Prompt V2

| Requisito | Status | Evidência atual | Risco/limitação | Ação proposta | Teste de aceite |
| --- | --- | --- | --- | --- | --- |
| Frontend/layout aprovado | PRONTO | `apps/web/*` + camada LogiMax | redesign acidental | congelar baseline | diff de `apps/web` = zero + screenshots desktop/tablet/mobile |
| Multi-tenant | PARCIAL | `tenantId` e filtro API | header pode ser forjado; sem banco/RLS | autenticação + membership + RLS no PostgreSQL | acesso cruzado retorna 403/404 |
| RBAC | PARCIAL | `rbac.js` + `assertPermission` | poucos perfis/ações | ampliar permissões sem remover atuais | matriz positiva/negativa por ação |
| Auth/sessões/MFA | AUSENTE | não existe sessão real | alto | módulo de auth compatível, sessão revogável, MFA opcional | login, logout, revogação e tenant scope |
| PostgreSQL/PostGIS | AUSENTE | JSON local | não é produção | adapter de persistência + migration controlada | mesma suíte roda no adapter novo; rollback documentado |
| Storage privado | AUSENTE | sem S3 | documentos não têm storage seguro | adapter S3-compatible + URLs assinadas | upload autorizado, acesso expirável e isolamento |
| Filas/jobs/DLQ | AUSENTE | requests síncronos | fiscal/webhook/import pesado | queue adapter por domínio | retry, dedupe e DLQ testados |
| Observabilidade | PARCIAL | healthcheck básico | sem tracing/métricas | logs estruturados, trace_id, health de dependências | health/readiness e logs sem PII |
| Marketplace de fretes | PARCIAL | fretes, matching, ofertas, contrato | sem contraproposta/chat/SLA | ampliar mesmas entidades/rotas | publicação → proposta → aceite idempotente |
| CRM/cotações | AUSENTE | não há leads/quotes | gap comercial | `/api/v1` + entidades versionadas | cotação → proposta → contrato |
| Pedidos/cargas/consolidação | AUSENTE | frete é entidade principal | não há pedido/load separado | introduzir sem substituir `freights` | pedido → carga com rastreabilidade |
| Motoristas/documentos | PARCIAL | cadastro básico, RNTRC/status | sem CNH/docs/validade/KYC | documentos e validações por adapter | expiração/bloqueio e isolamento |
| Frota/veículos/implementos | AUSENTE | placa fica no motorista/viagem | sem inventário/manutenção | módulo de frota | impedir dupla alocação e veículo bloqueado |
| Pneus/manutenção/abastecimento | AUSENTE | não existe | custo operacional incompleto | módulos internos de frota | OS, indisponibilidade e custo/km |
| Viagem/state machine | PARCIAL | `status-machine.js`, timeline | faltam vários eventos/evidências | ampliar sem renomear status atuais | transições inválidas bloqueadas |
| Tracking | PARCIAL | ping manual e última posição | sem GPS real/geofence/ETA | adapter telemetria/mapa | posição tenant-safe + evento geofence idempotente |
| POD | AUSENTE | não existe | entrega sem prova digital | POD versionado + storage | POD vinculado à viagem, hash/anexos |
| Ocorrências | PARCIAL | incidente simples | sem SLA/evidência/resolução | completar entidade/fluxo | abertura → tratamento → resolução auditada |
| Devolução/reentrega/claims | AUSENTE | não existe | pós-entrega incompleto | módulo vinculado à viagem/financeiro | claim com evidência e impacto financeiro |
| NF-e/XML | AUSENTE | não há importador | fiscal incompleto | parser versionado + storage original | duplicidade por chave bloqueada |
| CT-e | PARCIAL | documento local + autorização simulada | não integrado à SEFAZ | provider oficial + homologação | autorização/rejeição/evento comprovados |
| MDF-e | PARCIAL | documento local | sem emissão/eventos/encerramento real | provider oficial | emissão + encerramento em homologação |
| RNTRC | PARCIAL | status manual no motorista | não há consulta oficial | adapter/provedor autorizado | evidência e timestamp da consulta |
| CIOT | PARCIAL | documento local | não há provider real | adapter de instituição autorizada | criação/consulta/encerramento real |
| Piso mínimo | AUSENTE | cálculo atual não usa tabela oficial versionada | compliance | engine versionada por vigência | cálculo reproduzível com versão registrada |
| PEF/Vale-Pedágio | AUSENTE | pedágio é valor simples | compliance | adapters e rule engine | VPO separado + justificativa de exceção |
| Seguros/GR | PARCIAL | requisitos/score básicos | sem apólices/averbação/provider | módulo seguro + GR | bloqueio/liberação auditável |
| Financeiro | PARCIAL | payment + settle | sem AR/AP/faturas/conciliação/DRE | completar mantendo `/api/finance` | faturamento → recebimento/acerto idempotente |
| Portal do cliente | AUSENTE | perfil viewer na API | não há portal autenticado | depois de auth/RLS | cliente vê somente dados autorizados |
| PWA motorista/offline | AUSENTE | perfil TAC na API | sem app/offline | depois de auth/storage/tracking | evento offline sincroniza sem duplicar |
| Comunicação | AUSENTE | sem mensagens/providers | não há notificações reais | adapters in-app/e-mail/WhatsApp/SMS | entrega/log/opt-in/retry |
| API pública/webhooks | AUSENTE | API interna `/api` | sem versionamento/assinatura | `/api/v1`, HMAC, replay protection | contract test + retry idempotente |
| EDI NOTFIS/OCOREN/CONEMB/DOCCOB | AUSENTE | não existe | depende de layout/cliente | adapter versionado SFTP/FTP/API | arquivo válido gera resultado e log por linha |
| ERP/SINTEGRA/EFD/SPED | AUSENTE | não existe | aplicabilidade depende de operação/contabilidade | adapter somente quando exigido | exportação validada contra especificação aplicável |
| BI/relatórios | PARCIAL | dashboard e KPIs básicos | alguns valores são estáticos de desenvolvimento | remover constantes quando houver fonte real; relatórios auditados | filtros + exportação com permissão |
| Busca global | PARCIAL | campo visual e dados atuais | cobertura limitada | indexar entidades novas sem mudar layout | busca tenant-safe por identificadores |
| Segurança/LGPD | PARCIAL | headers básicos, tenant/RBAC | sem auth, rate limit, storage seguro | hardening incremental | IDOR/BOLA, secrets, uploads, retenção |
| Backup/DR/SLO/RPO/RTO | AUSENTE | não há infraestrutura de produção | alto | definir após banco/storage | restore testado + runbook |
| YMS-lite/docas | AUSENTE | não existe | opcional por tenant | feature flag | check-in → doca → liberação |
| Refrigerado/IoT | AUSENTE | carga refrigerada existe como tipo | sem sensor/temperatura | adapter opcional | alerta de faixa fora do limite |
| CO2 gerencial | AUSENTE | não existe | não crítico | fase posterior | cálculo explicável e opcional |

## Dependências externas bloqueantes

Não marcar como `PRONTO` sem credencial/contrato e teste real de homologação/sandbox quando aplicável:

- SEFAZ/CT-e/MDF-e;
- ANTT/RNTRC/CIOT/PEF;
- fornecedor de Vale-Pedágio;
- banco/PSP;
- mapas/rotas;
- telemetria/rastreador;
- storage S3-compatible;
- WhatsApp/BSP, e-mail e SMS;
- KYC/KYB/biometria;
- gerenciadora de risco/seguradora;
- layouts EDI específicos de clientes.

## Plano incremental aprovado

1. **Baseline/auditoria:** testes existentes, screenshots e matriz de gaps, sem alterar frontend.
2. **Fundação:** auth/sessões, persistência real por adapter, tenant/RBAC forte, storage, filas e observabilidade.
3. **Core TMS:** cadastros, clientes, motoristas, frota, pedidos/cargas, CRM/cotações.
4. **Marketplace/viagem:** matching, propostas/contrapropostas, contratos, tracking, POD e ocorrências.
5. **Fiscal/ANTT:** integrações oficiais e rule engines versionados.
6. **Financeiro:** AR/AP, faturamento, acertos, PSP, conciliação e DRE.
7. **Portal/PWA/EDI/BI:** após auth, storage e isolamento estarem maduros.
8. **Hardening:** performance, segurança, DR, SLO, carga e go-live.

## Decisões desta auditoria

- Não migrar nem reescrever o frontend.
- Não alterar `apps/web/*` neste lote.
- Não substituir as rotas `/api/*` existentes; novas capacidades serão aditivas.
- Não promover o JSON local como persistência de produção.
- Não declarar integrações fiscais/regulatórias/financeiras como reais sem homologação.
- Não duplicar módulos existentes: ampliar as entidades e contratos atuais quando compatível.
