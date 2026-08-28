# Deploy

## Local

```bash
npm start
```

Acesse `http://localhost:3000`.

## Homologacao

Antes do deploy de homologacao:

```bash
npm test
```

Validar tambem:

- variaveis de ambiente;
- tenant isolado;
- logs sem dados sensiveis;
- armazenamento separado;
- integracoes apontando para homologacao.

## Producao

Nao promover esta versao para producao com dados em memoria. A producao exige banco real, autenticacao, storage, filas, monitoramento, homologacoes fiscais/regulatorias e gestao segura de segredos.
