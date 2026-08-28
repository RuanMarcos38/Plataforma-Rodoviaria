# Segurança

## Princípios

- Nenhuma credencial real no repositório.
- Multi-tenant obrigatório em API, banco, storage e filas.
- RBAC por perfil e permissão.
- Auditoria para eventos críticos.
- Idempotência para pagamentos, fiscal, CIOT, contratação e webhooks.
- Certificados digitais somente em cofre de segredo.

## Dados sensíveis

Dados como CPF, CNH, RNTRC, biometria, localização, dados bancários, documentos fiscais e comprovantes exigem criptografia, logs de acesso, finalidade clara e política de retenção.

## MVP local

Esta versão usa dados de semente em memória. Ela não deve receber dados reais de clientes, motoristas ou empresas.

## Produção

Antes de produção, implementar:

- autenticação;
- autorização server-side;
- policies de banco;
- rate limit;
- proteção CSRF quando aplicável;
- secrets manager;
- logs estruturados;
- trilha de auditoria imutável;
- processos de exportação e exclusão conforme LGPD.
