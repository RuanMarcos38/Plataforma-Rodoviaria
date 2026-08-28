# Arquitetura

Este repositorio inicia a Plataforma Rodoviaria como um monorepo isolado. A primeira entrega e um MVP local com API Node.js sem dependencias externas, frontend web estatico e regras de dominio compartilhadas.

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
```

## Decisoes iniciais

- Multi-tenant por `tenantId` em todas as entidades operacionais.
- RBAC centralizado em `packages/domain/rbac.js`.
- State machine centralizada em `packages/domain/status-machine.js`.
- API stateless no desenho, com armazenamento em memoria apenas para o MVP local.
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

## Proxima arquitetura alvo

A evolucao natural e migrar a API para Node.js + TypeScript + NestJS, banco PostgreSQL + PostGIS, filas para processos fiscais e notificacoes, cache Redis, workers assíncronos e storage S3 compativel para documentos.
