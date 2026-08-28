# Arquitetura

Este repositorio inicia a Plataforma Rodoviaria como um monorepo isolado. A primeira entrega e um MVP local com API Node.js sem dependencias externas, frontend web estatico, persistencia local em arquivo e regras de dominio compartilhadas.

## Estrutura

```text
apps/
  api/          API HTTP local e servidor de arquivos
  web/          Interface operacional
packages/
  domain/       Regras de negocio, RBAC, calculos e dados de semente
docs/           Documentacao tecnica e requisitos
assets/         Referencias visuais do projeto
tests/          Testes automatizados iniciais
scripts/        Scripts locais de execucao e teste
```

## Decisoes iniciais

- Multi-tenant por `tenantId` em todas as entidades operacionais.
- RBAC centralizado em `packages/domain/rbac.js`.
- State machine centralizada em `packages/domain/status-machine.js`.
- API sem dependencias externas, com armazenamento local em `data/dev-store.json` para desenvolvimento.
- O arquivo local de dados e ignorado pelo Git.
- Integracoes fiscais, reguladoras, financeiras e de mapas desacopladas por modulo.
- Nenhuma credencial real deve ser versionada.

## Modulos do MVP

- Torre de controle
- Marketplace de fretes
- Matching de motoristas
- Viagens e rastreamento
- Fiscal e regulatorio
- Financeiro e pagamentos protegidos
- Administracao de tenant e marca
- Auditoria operacional
- Persistencia local de desenvolvimento

## Proxima arquitetura alvo

A evolucao natural e migrar a API para Node.js + TypeScript + NestJS, banco PostgreSQL + PostGIS, filas para processos fiscais e notificacoes, cache Redis, workers assíncronos e storage S3 compativel para documentos.
