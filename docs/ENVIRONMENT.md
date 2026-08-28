# Ambientes

## Arquivo local

Copie `.env.example` para `.env` quando precisar personalizar porta ou provedores.

## Variáveis

| Nome | Função |
| --- | --- |
| `PORT` | Porta HTTP local |
| `APP_ENV` | Ambiente atual |
| `DEFAULT_TENANT_ID` | Empresa carregada por padrão |
| `PUBLIC_APP_NAME` | Nome exibido inicialmente |
| `DATA_FILE` | Arquivo JSON usado pela persistência local |
| `MAP_PROVIDER` | Provedor de mapas |
| `FISCAL_PROVIDER` | Provedor fiscal |
| `PAYMENT_PROVIDER` | Provedor financeiro |
| `NOTIFICATION_PROVIDER` | Provedor de mensagens |

## Segredos

Tokens, certificados, senhas, segredos de webhook e chaves privadas não devem entrar em `.env.example`, commits ou mensagens de log.
