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

## Feedback pós-ação: flash de sessão vira toast
Após mutações, redirecione com uma das quatro flash keys `success|error|warning|info` e mensagem em português — HandleInertiaRequests as compartilha e o hook use-flash-messages exibe o toast no front. Não invente outras keys nem dispare toasts manualmente para feedback de mutação.

## Validação de escrita de domínio sempre via Form Request
Toda validação de escrita em controllers de domínio usa Form Request — nunca $request->validate() inline. O Form Request carrega rules(), authorize() com $this->user()->can(Permissions::X) espelhando o can: da rota, e messages() em pt-BR. O scaffold herdado de Auth/Settings é a única exceção.
