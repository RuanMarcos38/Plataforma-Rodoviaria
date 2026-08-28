# Deploy

## Local

```bash
npm start
```

Acesse `http://localhost:3000`.

No Windows, quando `node` não estiver no PATH:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

## Homologação

Antes do deploy de homologação:

```bash
npm test
```

No Windows, quando `node` não estiver no PATH:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-local.ps1
```

Validar também:

- variáveis de ambiente;
- empresa isolada;
- logs sem dados sensíveis;
- armazenamento separado;
- integrações apontando para homologação.

## Produção

Não promover esta versão para produção com `data/dev-store.json`. A produção exige banco real, autenticação, storage, filas, monitoramento, homologações fiscais/regulatórias e gestão segura de segredos.
