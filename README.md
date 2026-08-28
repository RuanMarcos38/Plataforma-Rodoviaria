# Plataforma Rodoviaria

MVP local da Plataforma Rodoviaria, um ecossistema nacional para marketplace de fretes, TMS, rastreamento, fiscal, financeiro, frota, motoristas e torre de controle.

## Executar

```bash
npm start
```

Acesse `http://localhost:3000`.

No Windows desta maquina, se `node` nao estiver no PATH:

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

## Modulos entregues no MVP

- Torre de controle com indicadores, mapa operacional e fila critica.
- Marketplace com busca, filtros e publicacao de cargas.
- Smart Freight Match com ranking de motoristas, envio de proposta e contratacao.
- Central de viagens com state machine, timeline e ping de rastreamento.
- Fiscal e regulatorio com estrutura para CT-e, MDF-e, CIOT e autorizacao em homologacao.
- Financeiro com pagamentos, liquidacao, status e idempotencia.
- Admin com identidade de marca parametrizavel por tenant.
- API local com persistencia em arquivo, RBAC, isolamento por tenant e auditoria.

## Estrutura

```text
apps/api        API HTTP local
apps/web        Interface web
packages/domain Regras de negocio compartilhadas
docs            Documentacao do produto e arquitetura
assets          Referencias visuais
data            Armazenamento local de desenvolvimento, ignorado pelo Git
scripts         Execucao e testes locais no Windows
tests           Testes automatizados iniciais
```

## Observacao

O prompt em `docs/PROMPT_MESTRE.md` e documento de requisitos e visao de produto. Esta primeira versao roda com dados de desenvolvimento em `data/dev-store.json` e nao deve receber dados reais, certificados, tokens ou chaves de producao.
