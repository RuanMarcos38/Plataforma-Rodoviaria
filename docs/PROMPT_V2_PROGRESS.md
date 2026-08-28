# Prompt V2 — Progresso da evolução

Data: 28/08/2026
Branch: `feat/prompt-v2-audit-foundation-20260828`
Baseline visual congelada: `main@79dd12d16965c2c933375f201db81282f808846b`

## Fase 0 — concluída

- Auditoria técnica e matriz de gaps registradas em `docs/PROMPT_V2_GAP_AUDIT.md`.
- Contratos `/api/*` existentes inventariados e preservados.
- Workflow de regressão criado para impedir alteração de `apps/web/*` em relação à baseline aprovada.
- Testes existentes executados com sucesso.
- Aplicação iniciada e smoke test da API concluído com sucesso.
- Screenshots desktop/tablet/mobile gerados automaticamente.

## Prova de preservação do frontend

O lote funcional não modificou nenhum arquivo em `apps/web/`.

Além do `git diff --exit-code` obrigatório no CI, as imagens renderizadas depois das alterações de backend são byte a byte idênticas às imagens da validação visual aprovada anteriormente:

| Viewport | SHA-256 baseline aprovada | SHA-256 após lote 1 | Resultado |
| --- | --- | --- | --- |
| Desktop | `c75c85474679207e0d63527deaeb99b4c6de884b9d25d66078755eceeb5673cc` | `c75c85474679207e0d63527deaeb99b4c6de884b9d25d66078755eceeb5673cc` | IDÊNTICO |
| Tablet | `07b394927675db9cea4ae93b7acbfd73868c15d7906b3f4914d7df71fb92f36b` | `07b394927675db9cea4ae93b7acbfd73868c15d7906b3f4914d7df71fb92f36b` | IDÊNTICO |
| Mobile | `3bf3bb3295cb6de6fabea4e7c2d1e66fedc87dab86b94b953b6fdef39bcf8ed9` | `3bf3bb3295cb6de6fabea4e7c2d1e66fedc87dab86b94b953b6fdef39bcf8ed9` | IDÊNTICO |

## Lote 1 — cadastros mestres seguros, sem UI nova

Implementado de forma aditiva no backend:

- coleção `customers`, compatível com arquivos de dados antigos;
- coleção `vehicles`, compatível com arquivos de dados antigos;
- validação/normalização de cliente e CNPJ;
- validação/normalização de placa, tipo, capacidade e status de veículo;
- prevenção de CNPJ duplicado por tenant;
- prevenção de placa duplicada por tenant;
- auditoria na criação de clientes e veículos;
- permissões aditivas de leitura/criação no RBAC, sem remover permissões existentes;
- novas rotas versionadas sem substituir contratos atuais:
  - `GET /api/v1/customers`
  - `POST /api/v1/customers`
  - `GET /api/v1/vehicles`
  - `POST /api/v1/vehicles`
- Idempotency-Key reutilizando o mecanismo já existente;
- filtros de consulta sempre limitados ao tenant atual.

## Testes adicionados

- validação e normalização de CNPJ;
- validação e normalização de placa;
- permissões de clientes/veículos;
- criação e consulta de cliente;
- rejeição de CNPJ duplicado;
- criação e consulta de veículo;
- isolamento de cliente entre tenants;
- isolamento de veículo entre tenants;
- negação de criação de cliente para perfil sem permissão;
- toda a suíte anterior de fretes, motoristas, propostas, contratos, tracking, fiscal e financeiro continua executada.

## Atualização dos gaps após o lote 1

| Área | Antes | Agora | Ainda falta |
| --- | --- | --- | --- |
| Clientes/cadastros mestres | AUSENTE no modelo próprio | PARCIAL | contatos, endereços completos, contratos, importação, qualidade/deduplicação avançada |
| Frota/veículos | AUSENTE | PARCIAL | implementos, documentos, vínculo motorista, manutenção, pneus, abastecimento, custos e indisponibilidade operacional |
| API pública versionada | AUSENTE | PARCIAL | autenticação real, OpenAPI, API keys/OAuth2, quotas, webhooks assinados |
| RBAC | PARCIAL | PARCIAL ampliado | auth real, escopo por filial, memberships persistidos e policies/RLS no banco |
| Persistência | PARCIAL/dev | PARCIAL/dev ampliado | PostgreSQL/PostGIS, migrations, backup/restore e RLS |

## Próximo lote recomendado

Fundação de produção, mantendo a mesma UI:

1. adapter de persistência para PostgreSQL sem remover o file store de desenvolvimento;
2. esquema/migrations de tenants, users, memberships, roles, customers e vehicles;
3. autenticação e sessões reais sem confiar em `x-role`/`x-tenant-id` fornecidos livremente pelo cliente;
4. isolamento por tenant no banco com políticas/constraints compatíveis;
5. health/readiness de banco e observabilidade básica;
6. testes explícitos de IDOR/BOLA e rollback.

Nenhuma integração fiscal, ANTT, bancária, storage ou telemetria deve ser marcada como pronta até existir credencial/provedor e homologação real.