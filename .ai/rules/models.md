---
paths:
  - 'app/Models/**'
---

# Models

## $fillable explícito, nunca $guarded
Todo model declara $fillable explícito; nunca use $guarded = []. O strict mode reporta atributos descartados fora do fillable, então toda coluna nova mass-assignável deve entrar no $fillable no mesmo change.

## Sem observers/booted: LogsActivity + events explícitos
Não use observers nem booted() para efeitos colaterais de model. Auditoria vem do trait LogsActivity com getActivitylogOptions() (logOnly explícito + logOnlyDirty); efeitos de domínio são Events dedicados com Listeners, e side-effects como invalidação de cache são chamados explicitamente nos métodos que mutam.

## Eager-load explícito por query; nunca $with no model
Nunca declare $with no model — eager-load explicitamente em cada uso com ->with([...]) ou ->load([...]). Model::shouldBeStrict() está ativo: lazy loading estoura em dev/teste e é reportado em produção, então declare as relações necessárias no call site.

## Dinheiro: Money VO em centavos inteiros; nunca float
Colunas monetárias usam o cast MoneyCast (Money VO em centavos int, coluna decimal 12,2) — nunca cast float/decimal built-in nem aritmética monetária fora do Money.
