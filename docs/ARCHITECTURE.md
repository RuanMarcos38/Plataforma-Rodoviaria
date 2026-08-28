# Arquitetura

Este repositório inicia a Plataforma Rodoviária como um monorepo isolado. A primeira entrega é um MVP local com API Node.js sem dependências externas, frontend web estático, persistência local em arquivo e regras de domínio compartilhadas.

## Estrutura

```text
apps/
  api/          API HTTP local e servidor de arquivos
  web/          Interface operacional
packages/
  domain/       Regras de negócio, RBAC, cálculos e dados de semente
docs/           Documentação técnica e requisitos
assets/         Referências visuais do projeto
tests/          Testes automatizados iniciais
scripts/        Scripts locais de execução e teste
```

## Decisões iniciais

- Multi-tenant por `tenantId` em todas as entidades operacionais.
- RBAC centralizado em `packages/domain/rbac.js`.
- Máquina de estados centralizada em `packages/domain/status-machine.js`.
- API sem dependências externas, com armazenamento local em `data/dev-store.json` para desenvolvimento.
- O arquivo local de dados é ignorado pelo Git.
- Integrações fiscais, reguladoras, financeiras e de mapas desacopladas por módulo.
- Nenhuma credencial real deve ser versionada.

## Módulos do MVP

- Torre de controle
- Mercado de fretes
- Alocação de motoristas
- Viagens e rastreamento
- Fiscal e regulatório
- Financeiro e pagamentos protegidos
- Administração de empresa e marca
- Auditoria operacional
- Persistência local de desenvolvimento

## Próxima arquitetura alvo

A evolução natural é migrar a API para Node.js + TypeScript + NestJS, banco PostgreSQL + PostGIS, filas para processos fiscais e notificações, cache Redis, workers assíncronos e storage S3 compatível para documentos.
