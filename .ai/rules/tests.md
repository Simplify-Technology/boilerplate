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
