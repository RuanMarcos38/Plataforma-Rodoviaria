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
| POST | `/drivers` | Cadastra motorista |
| GET | `/offers` | Lista propostas |
| POST | `/offers` | Envia proposta |
| GET | `/contracts` | Lista contratos |
| POST | `/contracts` | Aceita proposta e cria viagem |
| GET | `/trips` | Lista viagens |
| POST | `/trips/:id/advance` | Avanca state machine |
| POST | `/tracking/ping` | Registra ping de rastreamento |
| GET | `/fiscal` | Documentos fiscais e regulatorios |
| POST | `/fiscal/authorize` | Autoriza documento em homologacao |
| GET | `/finance` | Pagamentos |
| POST | `/payments/:id/settle` | Liquida pagamento |
| GET | `/risk` | Checks antifraude |
| GET | `/incidents` | Lista ocorrencias |
| POST | `/incidents` | Registra ocorrencia |
| POST | `/brand` | Atualiza identidade do tenant |
| GET | `/audit` | Eventos auditaveis |

## Regra de tenant

Uma entidade so e retornada quando `entity.tenantId` corresponde ao `x-tenant-id`. O MVP usa dados em memoria, mas a mesma regra deve virar policy no banco de producao.

## Persistencia local

Por padrao, a API salva alteracoes em `data/dev-store.json`. Esse arquivo e ignorado pelo Git para evitar publicar dados locais.
