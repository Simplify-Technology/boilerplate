<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| Padrões e guia de segurança do agente com sotaque Laravel
|--------------------------------------------------------------------------
|
| O plugin security-guidance lê dois arquivos do projeto: security-patterns.json
| (checagem determinística a cada Edit/Write — os padrões built-in cobrem JS,
| Python, Go e YAML, nenhum PHP/Blade/Eloquent) e claude-security-guidance.md
| (anexado ao prompt de todo review por modelo). Os dois citam nomes reais do
| código, e nome citado apodrece: o kit de partida apontava para
| app/Traits/HasRolesAndPermissions.php, que não existe — o trait mora em
| app/Traits/Models/. Cada contrato abaixo impede um modo de falha:
|
| 1. o JSON é válido e cabe nos limites que o plugin impõe (50 regras, lembrete
|    de 1 KB) — regra além do teto é descartada em silêncio;
| 2. cada regra tem nome único, lembrete e exatamente um de regex/substrings,
|    e a regex compila — regra malformada some sem aviso;
| 3. todo caminho concreto em paths/exclude_paths existe no disco — é a classe
|    do erro do kit: exclusão que não casa nada e o lembrete dispara onde não
|    devia (ou deixa de excluir o que devia);
| 4. o guia cabe no teto de 8 KB do plugin e toda classe App\… e todo arquivo
|    do repositório que ele cita existem — frase sobre código que sumiu vira
|    achado falso do reviewer.
|
*/

function securityRoot(): string
{
    return dirname(__DIR__, 3);
}

/**
 * @return list<array<string, mixed>>
 */
function securityPatterns(): array
{
    $path = securityRoot() . '/.claude/security-patterns.json';

    expect(file_exists($path))->toBeTrue('.claude/security-patterns.json precisa existir');

    $decoded = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

    return $decoded['patterns'];
}

function securityGuidance(): string
{
    $path = securityRoot() . '/.claude/claude-security-guidance.md';

    expect(file_exists($path))->toBeTrue('.claude/claude-security-guidance.md precisa existir');

    return (string) file_get_contents($path);
}

/**
 * @return list<string> caminhos sem metacaractere de glob, já sem o prefixo **\/
 */
function securityConcretePaths(array $pattern): array
{
    $concrete = [];

    foreach (array_merge($pattern['paths'] ?? [], $pattern['exclude_paths'] ?? []) as $glob) {
        $stripped = preg_replace('#^\*\*/#', '', $glob);

        if (preg_match('/[*?\[\]{}]/', (string) $stripped) !== 1) {
            $concrete[] = (string) $stripped;
        }
    }

    return $concrete;
}

it('o JSON de padrões é válido e cabe nos limites do plugin', function(): void {
    $patterns = securityPatterns();

    expect($patterns)->not->toBeEmpty();
    expect(count($patterns))->toBeLessThanOrEqual(50);

    foreach ($patterns as $pattern) {
        expect(strlen($pattern['reminder']))->toBeLessThanOrEqual(1024, "{$pattern['rule_name']}: lembrete acima de 1 KB é cortado pelo plugin");
    }
});

it('cada regra tem nome único, lembrete e exatamente uma forma de casar, com regex que compila', function(): void {
    $names = [];

    foreach (securityPatterns() as $pattern) {
        expect($pattern)->toHaveKeys(['rule_name', 'reminder']);
        expect(in_array($pattern['rule_name'], $names, true))->toBeFalse("rule_name duplicado: {$pattern['rule_name']}");
        $names[] = $pattern['rule_name'];

        $hasRegex      = array_key_exists('regex', $pattern);
        $hasSubstrings = array_key_exists('substrings', $pattern);

        expect($hasRegex xor $hasSubstrings)->toBeTrue("{$pattern['rule_name']}: use regex OU substrings, nunca os dois nem nenhum");

        if ($hasRegex) {
            expect(@preg_match('~' . $pattern['regex'] . '~u', ''))->not->toBeFalse("{$pattern['rule_name']}: regex não compila");
        } else {
            expect($pattern['substrings'])->not->toBeEmpty();
        }
    }
});

it('todo caminho concreto em paths e exclude_paths existe no disco', function(): void {
    foreach (securityPatterns() as $pattern) {
        foreach (securityConcretePaths($pattern) as $path) {
            expect(file_exists(securityRoot() . '/' . $path))
                ->toBeTrue("{$pattern['rule_name']} cita {$path}, que não existe — o lembrete vai disparar (ou deixar de excluir) onde não devia");
        }
    }
});

it('todo glob tem prefixo que existe e a forma que o fnmatch do plugin entende', function(): void {
    foreach (securityPatterns() as $pattern) {
        foreach (array_merge($pattern['paths'] ?? [], $pattern['exclude_paths'] ?? []) as $glob) {
            // O plugin casa com fnmatch: `dir/**/*.php` exige um subdiretório e NÃO casa
            // `routes/web.php`; `dir/**` casa qualquer profundidade, inclusive zero.
            expect(preg_match('#[A-Za-z0-9]/\*\*/\*#', $glob))
                ->toBe(0, "{$pattern['rule_name']}: {$glob} não casa arquivo direto no diretório — use `dir/**`");

            $prefix = preg_replace('#^\*\*/#', '', (string) preg_replace('/[*?\[\]{}].*$/', '', $glob));

            if ($prefix !== '') {
                expect(file_exists(securityRoot() . '/' . $prefix))
                    ->toBeTrue("{$pattern['rule_name']}: o prefixo {$prefix} de {$glob} não existe no repositório");
            }
        }
    }
});

it('o guia cabe no teto do plugin e só cita classes e arquivos que existem', function(): void {
    $guidance = securityGuidance();

    expect(strlen($guidance))->toBeLessThanOrEqual(8192, 'o plugin concatena os guias com teto combinado de 8 KB');

    preg_match_all('/\bApp\\\\(?:[A-Z][A-Za-z0-9]*\\\\)*[A-Z][A-Za-z0-9]*/', $guidance, $classes);

    expect($classes[0])->not->toBeEmpty();

    foreach (array_unique($classes[0]) as $class) {
        expect(class_exists($class) || enum_exists($class) || trait_exists($class) || interface_exists($class))
            ->toBeTrue("o guia cita {$class}, que não existe");
    }

    preg_match_all('#\b(?:app|bootstrap|config|routes|tests|database)/[A-Za-z0-9/_.-]+\.php\b#', $guidance, $files);

    expect($files[0])->not->toBeEmpty();

    foreach (array_unique($files[0]) as $file) {
        expect(file_exists(securityRoot() . '/' . $file))->toBeTrue("o guia cita {$file}, que não existe");
    }

    foreach (securityPatterns() as $pattern) {
        preg_match_all('#\.ai/rules/[a-z-]+\.md#', $pattern['reminder'], $rules);

        foreach ($rules[0] as $rule) {
            expect(file_exists(securityRoot() . '/' . $rule))->toBeTrue("{$pattern['rule_name']} cita {$rule}, que não existe");
        }
    }
});
