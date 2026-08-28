# Deploy

## Local

```bash
npm start
```

Acesse `http://localhost:3000`.

No Windows, quando `node` nao estiver no PATH:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

## Homologacao

Antes do deploy de homologacao:

```bash
npm test
```

No Windows, quando `node` nao estiver no PATH:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-local.ps1
```

Validar tambem:

- variaveis de ambiente;
- tenant isolado;
- logs sem dados sensiveis;
- armazenamento separado;
- integracoes apontando para homologacao.

## Producao

Nao promover esta versao para producao com `data/dev-store.json`. A producao exige banco real, autenticacao, storage, filas, monitoramento, homologacoes fiscais/regulatorias e gestao segura de segredos.
