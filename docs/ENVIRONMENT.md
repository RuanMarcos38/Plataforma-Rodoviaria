# Ambientes

## Arquivo local

Copie `.env.example` para `.env` quando precisar customizar porta ou provedores.

## Variaveis

| Nome | Funcao |
| --- | --- |
| `PORT` | Porta HTTP local |
| `APP_ENV` | Ambiente atual |
| `DEFAULT_TENANT_ID` | Tenant carregado por padrao |
| `PUBLIC_APP_NAME` | Nome exibido inicialmente |
| `DATA_FILE` | Arquivo JSON usado pela persistencia local |
| `MAP_PROVIDER` | Provedor de mapas |
| `FISCAL_PROVIDER` | Provedor fiscal |
| `PAYMENT_PROVIDER` | Provedor financeiro |
| `NOTIFICATION_PROVIDER` | Provedor de mensagens |

## Segredos

Tokens, certificados, senhas, webhooks secrets e chaves privadas nao devem entrar em `.env.example`, commits ou mensagens de log.
