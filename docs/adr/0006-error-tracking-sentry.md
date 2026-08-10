# ADR 0006 — Error tracking: Sentry como padrão homologado, opt-in

**Status:** aceito

## Contexto

Erros em produção precisam de tracking dedicado (agrupamento, releases, contexto de request), o que logs sozinhos não dão. Cada fork escolhendo uma ferramenta diferente fragmenta o suporte. Por outro lado, nem todo cliente contrata observabilidade desde o início, e enviar dados de erro para terceiros exige cuidado com PII.

## Decisão

Sentry é o padrão **homologado** de error tracking: quando o projeto contratar, é ele que se instala — sem reavaliar ferramenta a cada fork. A integração fica desligada por padrão: **`SENTRY_LARAVEL_DSN` vazio = desligado**, sem custo nem envio de dados. O scrubbing de PII (`App\Support\Logging\PiiScrubber`) já fica preparado no boilerplate para sanitizar payloads antes do envio.

## Consequências

- Boilerplate não carrega DSN nem dependência ativa; ligar é preencher o DSN e instalar o SDK conforme a documentação do Sentry para Laravel.
- Um único fornecedor homologado: playbooks de triagem, alerta e release health valem para todos os forks.
- Qualquer dado novo enviado ao Sentry deve passar pelo scrubbing de PII; ampliar o payload exige revisar o scrubber junto.
