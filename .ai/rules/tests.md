---
paths:
  - 'tests/**'
---

# Tests

## Pest com it() e datasets
Escreva testes Pest com it('faz X', ...) — não test() nem describe(). Para matrizes de casos, use datasets encadeando ->with([...]) no próprio teste.

## RefreshDatabase global via Pest.php
RefreshDatabase já é aplicado a toda tests/Feature pelo pest()->extend(...)->in('Feature') em tests/Pest.php — não declare uses(RefreshDatabase::class) por arquivo. Unit/Arch rodam sem app bootado; teste Unit que precise do container declara uses(Tests\TestCase::class) no próprio arquivo.

## Factories + helpers de persona do Pest.php
Crie dados com factories e obtenha usuários pelos helpers de persona de tests/Pest.php — actingAsSuperUser(), actingAsUserWithRole(Roles::X), userWithRole(), guestUser() — que já semeiam o PermissionRoleSeeder sob demanda. Não monte roles/permissões à mão nem adicione beforeEach de seed.

## Testes de integração real, sem Mockery
Não use Mockery/shouldReceive/partialMock: os testes exercitam serviços e banco reais de ponta a ponta. Fakes de facade (Mail::fake() etc.) são o único dublê aceito. Http::preventStrayRequests() está ativo no TestCase — falsifique todo HTTP externo com Http::fake().

## Cobertura real: efeito observado, negação sem efeito colateral e cache primado
Todo comportamento novo tem pelo menos dois cenários: o caminho feliz com payload REAL (não vazio, mudança efetiva — trocar um conjunto por outro, não só limpar), assertando o resultado de negócio (status, redirect, permissão efetiva) E o estado persistido; e a negação (403/422), provando que nada mudou — sem escrita, sem cache tocado, sem evento ou job disparado. Onde existe cache, evento ou fila, prime antes de assertar que permanece; invalidação se prova em três passos — invalidar, repopular no acesso seguinte, invalidar de novo — e só para os afetados (`tests/Feature/PermissionRole/UpdateRolePermissionsInvalidatesUserCacheTest.php` é o modelo: quem tem o cargo alterado perde `user:{id}:permissions`, quem tem outro cargo mantém). Endpoint que recebe lista cobre o array vazio (quando permitido) e um não vazio, e trava o contrato do payload (nomes vs ids) com um caso que falha no formato errado. O nome do teste descreve o efeito observado, não os passos de implementação.
