---
paths:
  - 'app/Policies/**'
---

# Policies

## RBAC próprio: enums são a fonte de verdade
Policies delegam a hasPermissionTo()/hasRole() do trait HasRolesAndPermissions e são registradas explicitamente via Gate::policy no AppServiceProvider. Não crie Gate::define avulso — permissões novas nascem como case do enum Permissions.

## Alcançar a conta e poder dar o acesso são perguntas diferentes
Ter a permissão, superar o alvo e poder conceder AQUILO são três tetos, e é fácil parar no segundo. `outranks()` responde "posso agir sobre esta conta?" (prioridade estritamente maior, `super_user` passa direto); `$ator->permissionsBeyondOwn($nomes)` responde "posso dar estes acessos?" — devolve o que o ator não tem, e é a mesma função nos dois caminhos de concessão (`UserPolicy::mutatePermissions` para permissão individual, `PermissionRole/UpdateController` para permissão de cargo). Quem concede passa a lista: `Gate::authorize('mutatePermissions', [$user, $nomes])`. Revogação NÃO passa pelo teto de conteúdo — tirar acesso não escala, e medi-lo contra o que o alvo já tem impediria o ator de limpar justamente o que ele não pode dar. O teto olha o payload inteiro, não o delta: o formulário reenvia a lista completa, então uma regra por delta deixaria reafirmar o que o ator não pode conceder.

## O teto é do humano, a permissão é da persona
Em impersonação, `hasPermissionTo()` é lido na persona (impersonar precisa reproduzir o que aquele usuário consegue fazer), mas todo TETO — prioridade e superfície de concessão — mede o usuário real, via `effectiveActor()`/`ImpersonationService::getOriginalUser()`. Medir teto na persona transforma vestir alguém em escada. Vale para policy, controller e resource.

## Negativa que precisa explicar sai por Response::deny
Devolva `bool` quando a recusa não deve vazar informação (falta de permissão, prioridade insuficiente) e `Illuminate\Auth\Access\Response::deny($frase)` quando a pessoa precisa saber o que travou — `Gate::authorize()` propaga a frase para o 403, e `Gate::inspect()` a expõe em teste sem depender de página de erro. A frase de recusa de concessão vem de `Permissions::grantDenialMessage()`, que nomeia as permissões que travaram; não escreva o texto à mão, porque as telas de RBAC oferecem o catálogo inteiro e uma recusa muda não diz qual caixa derrubou o save.
