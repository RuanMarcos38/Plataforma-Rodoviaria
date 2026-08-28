# Integrações

Esta versão não chama APIs oficiais. Ela prepara contratos internos para conectar provedores reais na etapa seguinte.

## Categorias

- Mapas: geocoding, rotas, ETA, pedágios, geofence e rastreamento.
- Fiscal: SEFAZ, CT-e, MDF-e, NF-e, DACTE e DAMDFE.
- Regulatório: ANTT, RNTRC, CIOT, piso mínimo e Vale-Pedágio.
- Risco: seguradoras, gerenciadoras e antifraude.
- Pagamentos: PIX, boleto, conta do motorista e pagamento protegido.
- Notificações: WhatsApp, e-mail, SMS e push.
- Documentos: OCR, assinatura, ePOD e armazenamento.

## Regras

- Consultar documentação oficial vigente antes de implementar regras fiscais.
- Versionar regras em tabelas como `regulatory_rules`, `regulatory_versions`, `fiscal_schemas` e `integration_versions`.
- Usar circuit breaker, retry com backoff e logs de webhook.
- Nunca simular API governamental como se fosse produção.
