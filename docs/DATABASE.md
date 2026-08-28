# Banco de Dados

O MVP ainda não conecta um banco real. A modelagem abaixo define o alvo PostgreSQL + PostGIS para a próxima etapa.

## Entidades principais

- `organizations`
- `organization_members`
- `roles`
- `permissions`
- `drivers`
- `driver_documents`
- `vehicles`
- `vehicle_documents`
- `trailers`
- `shippers`
- `carriers`
- `freights`
- `freight_items`
- `freight_requirements`
- `freight_offers`
- `freight_contracts`
- `contracts`
- `trips`
- `trip_events`
- `routes`
- `location_pings`
- `geofences`
- `documents`
- `fiscal_documents`
- `cte_documents`
- `mdfe_documents`
- `ciot_operations`
- `toll_operations`
- `payments`
- `payment_transactions`
- `insurance_policies`
- `risk_checks`
- `incidents`
- `audit_events`

## Regras

- Toda tabela operacional deve ter `tenant_id`.
- Dados geográficos devem usar PostGIS.
- Eventos de viagem devem ser append-only.
- Pagamentos, fiscais, CIOT, MDF-e e CT-e devem usar idempotência.
- Dados de documentos e localização devem ter retenção e acesso compatíveis com LGPD.

## Isolamento

Não reutilizar banco, schema, buckets, policies ou functions de outros projetos. Em Supabase, criar projeto ou schema isolado antes de qualquer migração.
