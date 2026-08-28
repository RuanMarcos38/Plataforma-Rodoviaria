# API

Base local: `http://localhost:3000/api`

Todas as chamadas aceitam:

- `x-tenant-id`: empresa atual.
- `x-role`: perfil RBAC atual.
- `Idempotency-Key`: chave para acoes criticas de escrita.

## Rotas

| Metodo | Rota | Funcao |
| --- | --- | --- |
| GET | `/health` | Status da API |
| GET | `/bootstrap` | Tenants, perfis, marca e estados |
| GET | `/dashboard` | Indicadores executivos |
| GET | `/freights` | Lista e filtra fretes |
| POST | `/freights` | Publica carga |
| GET | `/drivers?freightId=` | Motoristas e ranking de matching |
| POST | `/offers` | Envia proposta |
| POST | `/contracts` | Aceita proposta e cria viagem |
| GET | `/trips` | Lista viagens |
| POST | `/trips/:id/advance` | Avanca state machine |
| GET | `/fiscal` | Documentos fiscais e regulatorios |
| GET | `/finance` | Pagamentos |
| GET | `/risk` | Checks antifraude |
| POST | `/incidents` | Registra ocorrencia |
| POST | `/brand` | Atualiza identidade do tenant |
| GET | `/audit` | Eventos auditaveis |

## Regra de tenant

Uma entidade so e retornada quando `entity.tenantId` corresponde ao `x-tenant-id`. O MVP usa dados em memoria, mas a mesma regra deve virar policy no banco de producao.
