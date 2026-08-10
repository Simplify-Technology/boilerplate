---
paths:
  - 'app/**'
---

# App

## Injeção por construtor com private readonly
Adquira services por injeção de construtor com promoção `private readonly` — inclusive em controllers invokable (no __invoke entram apenas Request/FormRequest e route params). Reserve app(X::class) para contextos sem DI: métodos estáticos e boot de providers.

## Facades em vez de helpers globais (exceto config/event)
Prefira facades (Auth, Cache, Session, Log, Gate, Hash) a helpers globais — nunca auth()/cache()/logger(). Exceções: config() e event() são usados como helpers; em contexto HTTP, acesse sessão via $request->session(), reservando Session:: para classes sem Request.

## Namespaces fora do skeleton: Enum singular, Support por contexto
Enums vivem em App\Enum (singular — nunca App\Enums). Helpers de domínio vão em App\Support\{Contexto} (Br, Logging) como classes final de métodos estáticos; traits de model em App\Traits\Models; DTOs em App\DataTransferObjects (por extenso); controllers e Form Requests agrupados em subpastas por domínio (User/, PermissionRole/), espelhadas entre Controllers e Requests.

## Arrays puros com funções nativas, não collect()
Itere arrays puros com array_map/array_filter/foreach — não os envolva em collect(). Reserve ->map()/->pluck() e demais métodos de Collection para Collections Eloquent que já existem (resultados de query/relações).

## Strings com funções nativas do PHP
Manipule strings com funções nativas do PHP (preg_replace, substr, sprintf, mb_strtolower etc.) — não introduza Str::of() fluente nem helpers Str:: em código novo.

## Datas são CarbonImmutable via Date::use
Todas as datas do app são CarbonImmutable (Date::use(CarbonImmutable::class) no AppServiceProvider). Crie datas com os helpers now()/today() e, em type hints e PHPDoc, use \Carbon\CarbonImmutable — nunca Carbon mutável ou Illuminate\Support\Carbon.

## Nunca logar PII crua; canais de log levam o PiiAwareTap
Nunca logue PII crua (CPF, email, telefone, nome) — logue ids e deixe o PiiScrubber redigir por chave e por padrão; todo canal novo em config/logging.php deve receber o tap PiiAwareTap. Para exibir CPF a quem não tem permissão, use CpfFormatter::mask.

## Ausências deliberadas: leia docs/adr antes de propor dependências
As ausências são deliberadas e documentadas em docs/adr: sem API/Sanctum (monólito Inertia com sessão), sem spatie/laravel-permission (RBAC próprio), sem TanStack Query, sem Telescope, sem repositories. Leia os ADRs antes de propor essas dependências; nova decisão estrutural ganha ADR sequencial no mesmo formato contexto → decisão → consequências.

## pt-BR para humanos, inglês para código e logs estruturados
App monolíngue pt_BR: textos voltados ao usuário (flash, labels, mensagens de validação, descrições de comando) hardcoded em português, sem __() nem chaves JSON — lang/pt_BR guarda só traduções de framework. Comentários, docblocks e ADRs em pt-BR; identificadores (classes, métodos, variáveis, rotas) e mensagens estruturadas de log em inglês.
