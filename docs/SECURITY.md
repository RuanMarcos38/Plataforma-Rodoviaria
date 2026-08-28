# Seguranca

## Principios

- Nenhuma credencial real no repositorio.
- Multi-tenant obrigatorio em API, banco, storage e filas.
- RBAC por perfil e permissao.
- Auditoria para eventos criticos.
- Idempotencia para pagamentos, fiscal, CIOT, contratacao e webhooks.
- Certificados digitais somente em cofre de segredo.

## Dados sensiveis

Dados como CPF, CNH, RNTRC, biometria, localizacao, dados bancarios, documentos fiscais e comprovantes exigem criptografia, logs de acesso, finalidade clara e politica de retencao.

## MVP local

Esta versao usa dados de semente em memoria. Ela nao deve receber dados reais de clientes, motoristas ou empresas.

## Produção

Antes de producao, implementar:

- autenticacao;
- autorizacao server-side;
- policies de banco;
- rate limit;
- protecao CSRF quando aplicavel;
- secrets manager;
- logs estruturados;
- trilha de auditoria imutavel;
- processos de exportacao e exclusao conforme LGPD.
