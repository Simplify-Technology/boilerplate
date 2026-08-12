---
paths:
  - 'app/Http/Controllers/**'
---

# Controllers

## Controllers single-action invokable por domínio
Controllers de domínio são single-action: `final class {Ação}Controller` com __invoke(), agrupados em subpasta por recurso (User/StoreController, PermissionRole/AssignRoleController) e registrados por FQCN nas rotas — nada de Route::resource nem controllers multi-método (o scaffold Auth/Settings é exceção herdada). A lógica do caso de uso vive no próprio controller; não existe camada de Actions, Jobs de request, repositories nem query objects — chame Eloquent direto. Extraia para App\Services apenas lógica reutilizada por vários controllers (classes final stateless, injetadas via construtor `private readonly`).

## Autorização em camadas redundantes
Autorize em camadas: middleware can:<permission> no grupo de rota, re-autorização dentro do controller ($this->authorize() ou Gate::authorize()) e authorize() com $this->user()->can() nos Form Requests de escrita. Nunca dependa de uma camada só.

## Props Inertia montadas por JsonResources
Controllers respondem com Inertia::render e montam props via JsonResources — new XResource($model) para item único, XResource::collection(...) ou o método estático toArrayCollection() (que usa resolve()) para listas planas. JsonResource::withoutWrapping() está ativo: nunca dependa do wrapper 'data' e não use response()->json().

## Closure em prop de render não adia nada; quem adia é optional/defer
Numa prop de Inertia::render, `fn() => ...` é sempre resolvida no full load — PropsResolver só pula do primeiro response quem implementa IgnoreFirstLoad, que são OptionalProp e DeferProp. Escolha pelo que o primeiro paint precisa: valor direto ou closure quando a página usa o dado de cara (a closure só evita o custo em partial reload que não pediu a chave, e serve para adiar serialização, nunca para economizar query); `Inertia::optional(fn () => ...)` para dado caro que o primeiro paint não usa e o cliente busca por nome com router.reload({ only: [...] }); `Inertia::defer(fn () => ..., 'grupo')` quando a puxada deve ser automática logo após o paint, com skeleton no <Deferred>. O contraste vale para props de render: em HandleInertiaRequests::share() a closure é a forma correta, porque a shared prop precisa reavaliar a cada request — é o caso do 'ziggy', que resolve $request->url(). E Inertia::once()/shareOnce() não são memoização intra-request: são cache no cliente entre visitas (ResolvesOnce expõe until/expiresAt/fresh), então não os use para evitar recomputar algo dentro do mesmo response, e pense duas vezes antes de aplicá-los a dado por usuário.

## Feedback pós-ação: Inertia::flash, nunca ->with() nem prop
Após mutações, chame `Inertia::flash('success'|'error'|'warning'|'info', 'mensagem em português')` ANTES do redirect e devolva o redirect limpo. Não use `->with('success', ...)`: aquilo grava na sessão do Laravel e só chegava à tela porque o share() republicava como prop — o que fazia o `pull` rodar e a mensagem sumir em partial reload que não pedisse a chave. O flash nativo entra no objeto de página, fora de props, e o middleware do Inertia o repassa pelo redirect sozinho. Não invente outras keys, não republique flash no share() e não use `session()->flash()` direto. Um cuidado de ordem: em código que invalida a sessão (logout, EnsureUserIsActive), o `Inertia::flash()` tem de vir DEPOIS do `invalidate()`/`regenerateToken()`, porque ele escreve na sessão na hora — ao contrário do `->with()`, que só era aplicado no envio da resposta.

## Validação de escrita de domínio sempre via Form Request
Toda validação de escrita em controllers de domínio usa Form Request — nunca $request->validate() inline. O Form Request carrega rules(), authorize() com $this->user()->can(Permissions::X) espelhando o can: da rota, e messages() em pt-BR. O scaffold herdado de Auth/Settings é a única exceção.

## Ordenação e page size de URL são entrada não confiável
Em listagem, `sort_by`, `sort_order` e `per_page` chegam do cliente e não podem ir crus para o builder: direção fora de `asc`/`desc` faz `Query\Builder::orderBy()` lançar `InvalidArgumentException` (500 alcançável por link) e page size sem teto puxa a tabela inteira num request. Normalize os três com `App\Support\Listing\ListQueryNormalizer` (`sortField` com allow-list explícita, `direction`, `perPage`) antes de tocar o query builder — allow-list só do campo não basta, a direção também precisa. E o eco em `filters` publica o valor NORMALIZADO, nunca o cru: com `withQueryString()` o valor volta para a URL, e ecoar o lixo torna o erro compartilhável por link.
