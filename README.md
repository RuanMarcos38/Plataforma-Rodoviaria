# Plataforma Rodoviaria

MVP local da Plataforma Rodoviaria, um ecossistema nacional para marketplace de fretes, TMS, rastreamento, fiscal, financeiro, frota, motoristas e torre de controle.

## Executar

```bash
npm start
```

Acesse `http://localhost:3000`.

## Testar

```bash
npm test
```

## Modulos entregues no MVP

- Torre de controle com indicadores, mapa operacional e fila critica.
- Marketplace com busca, filtros e publicacao de cargas.
- Smart Freight Match com ranking de motoristas e envio de proposta.
- Central de viagens com state machine e timeline.
- Fiscal e regulatorio com estrutura para CT-e, MDF-e e CIOT.
- Financeiro com pagamentos, status e idempotencia.
- Admin com identidade de marca parametrizavel por tenant.
- API local com RBAC, isolamento por tenant e auditoria.

## Estrutura

```text
apps/api        API HTTP local
apps/web        Interface web
packages/domain Regras de negocio compartilhadas
docs            Documentacao do produto e arquitetura
assets          Referencias visuais
tests           Testes automatizados iniciais
```

## Observacao

O prompt em `docs/PROMPT_MESTRE.md` e documento de requisitos e visao de produto. Esta primeira versao roda com dados de semente em memoria e nao deve receber dados reais, certificados, tokens ou chaves de producao.
