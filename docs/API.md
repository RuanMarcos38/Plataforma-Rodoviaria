# API

Base local: `http://localhost:3000/api`

Todas as chamadas aceitam:

- `x-tenant-id`: empresa atual.
- `x-role`: perfil RBAC atual.
- `Idempotency-Key`: chave para ações críticas de escrita.

## Rotas

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/health` | Status da API |
| GET | `/bootstrap` | Empresas, perfis, marca e estados |
| GET | `/dashboard` | Indicadores executivos |
| GET | `/freights` | Lista e filtra fretes |
| POST | `/freights` | Publica carga |
| GET | `/drivers?freightId=` | Motoristas e ranking de alocação |
| POST | `/drivers` | Cadastra motorista |
| GET | `/offers` | Lista propostas |
| POST | `/offers` | Envia proposta |
| GET | `/contracts` | Lista contratos |
| POST | `/contracts` | Aceita proposta e cria viagem |
| GET | `/trips` | Lista viagens |
| POST | `/trips/:id/advance` | Avança máquina de estados |
| POST | `/tracking/ping` | Registra ping de rastreamento |
| GET | `/fiscal` | Documentos fiscais e regulatórios |
| POST | `/fiscal/authorize` | Autoriza documento em homologação |
| GET | `/finance` | Pagamentos |
| POST | `/payments/:id/settle` | Liquida pagamento |
| GET | `/risk` | Checks antifraude |
| GET | `/incidents` | Lista ocorrências |
| POST | `/incidents` | Registra ocorrência |
| POST | `/brand` | Atualiza identidade da empresa |
| GET | `/audit` | Eventos auditáveis |

## Regra de empresa

Uma entidade só é retornada quando `entity.tenantId` corresponde ao `x-tenant-id`. O MVP usa dados em memória, mas a mesma regra deve virar policy no banco de produção.

## Persistência local

Por padrão, a API salva alterações em `data/dev-store.json`. Esse arquivo é ignorado pelo Git para evitar publicar dados locais.
