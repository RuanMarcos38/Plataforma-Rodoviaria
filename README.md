# Plataforma Rodoviária

MVP local da Plataforma Rodoviária, um ecossistema nacional para mercado de fretes, TMS, rastreamento, fiscal, financeiro, frota, motoristas e torre de controle.

## Executar

```bash
npm start
```

Acesse `http://localhost:3000`.

No Windows desta máquina, se `node` não estiver no PATH:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

## Testar

```bash
npm test
```

Ou, no Windows com runtime embutido do Codex:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-local.ps1
```

## Módulos entregues no MVP

- Torre de controle com indicadores, mapa operacional e fila crítica.
- Mercado de fretes com busca, filtros e publicação de cargas.
- Alocação inteligente com ranking de motoristas, envio de proposta e contratação.
- Central de viagens com máquina de estados, histórico e ping de rastreamento.
- Fiscal e regulatório com estrutura para CT-e, MDF-e, CIOT e autorização em homologação.
- Financeiro com pagamentos, liquidação, status e idempotência.
- Administração com identidade de marca parametrizável por empresa.
- API local com persistência em arquivo, RBAC, isolamento por empresa e auditoria.

## Estrutura

```text
apps/api        API HTTP local
apps/web        Interface web
packages/domain Regras de negócio compartilhadas
docs            Documentação do produto e arquitetura
assets          Referências visuais
data            Armazenamento local de desenvolvimento, ignorado pelo Git
scripts         Execução e testes locais no Windows
tests           Testes automatizados iniciais
```

## Observação

O prompt em `docs/PROMPT_MESTRE.md` é documento de requisitos e visão de produto. Esta primeira versão roda com dados de desenvolvimento em `data/dev-store.json` e não deve receber dados reais, certificados, tokens ou chaves de produção.
