<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| Settings compartilhado do agente: gate no fim do turno e guarda do git
|--------------------------------------------------------------------------
|
| .claude/settings.json é versionado e vale para quem clona: hooks que rodam
| fora do modelo (o harness executa, o agente não escolhe), aprovação do MCP
| do Boost e o plugin de segurança com o modelo de review fixado. Cada
| contrato abaixo impede um modo de falha concreto:
|
| 1. o settings é JSON válido — um vírgula sobrando desliga TODOS os hooks
|    em silêncio;
| 2. cada hook aponta para um script em .claude/hooks que existe e é
|    executável — hook com comando inexistente falha em silêncio a cada
|    turno e ninguém percebe;
| 3. os três eventos que sustentam o gate estão lá: UserPromptSubmit grava a
|    baseline, Stop confere o turno, PreToolUse(Bash) barra bypass do husky;
| 4. o MCP do Boost está aprovado pelo nome que o .mcp.json declara — senão
|    cada dev aprova à mão e o servidor fica desligado até então;
| 5. o plugin de segurança vem com SECURITY_REVIEW_MODEL definido — o default
|    do plugin é Opus, e o custo por turno é a armadilha desta fatia;
| 6. o .gitignore cobre o estado do gate e os arquivos locais do agente —
|    hoje settings.local.json só não aparece por causa do gitignore GLOBAL de
|    uma máquina.
|
*/

function hooksRoot(): string
{
    return dirname(__DIR__, 3);
}

/**
 * @return array<string, mixed>
 */
function hooksSettings(): array
{
    $path = hooksRoot() . '/.claude/settings.json';

    expect(file_exists($path))->toBeTrue('.claude/settings.json precisa existir e ser versionado');

    return json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
}

/**
 * @return list<array{event: string, matcher: ?string, command: string}>
 */
function hooksCommands(): array
{
    $commands = [];

    foreach (hooksSettings()['hooks'] ?? [] as $event => $groups) {
        foreach ($groups as $group) {
            foreach ($group['hooks'] ?? [] as $hook) {
                $commands[] = [
                    'event'   => $event,
                    'matcher' => $group['matcher'] ?? null,
                    'command' => (string) ($hook['command'] ?? ''),
                ];
            }
        }
    }

    return $commands;
}

it('o settings compartilhado é JSON válido com hooks', function(): void {
    $settings = hooksSettings();

    expect($settings)->toHaveKey('hooks');
    expect(hooksCommands())->not->toBeEmpty();
});

it('cada hook aponta para um script existente e executável em .claude/hooks', function(): void {
    foreach (hooksCommands() as $hook) {
        expect(preg_match('#\.claude/hooks/([a-z0-9._-]+)#', $hook['command'], $match))
            ->toBe(1, "hook {$hook['event']} não referencia um script em .claude/hooks: {$hook['command']}");

        $script = hooksRoot() . '/.claude/hooks/' . $match[1];

        expect(is_file($script))->toBeTrue("{$match[1]} não existe");
        expect(is_executable($script))->toBeTrue("{$match[1]} não é executável (chmod +x)");
    }
});

it('a baseline, o gate do Stop e a guarda do Bash estão configurados', function(): void {
    $byEvent = [];

    foreach (hooksCommands() as $hook) {
        $byEvent[$hook['event']][] = $hook;
    }

    expect($byEvent)->toHaveKeys(['UserPromptSubmit', 'Stop', 'PreToolUse']);
    expect($byEvent['UserPromptSubmit'][0]['command'])->toContain('ci-gate.sh baseline');
    expect($byEvent['Stop'][0]['command'])->toContain('ci-gate.sh check');
    expect($byEvent['PreToolUse'][0]['matcher'])->toBe('Bash');
    expect($byEvent['PreToolUse'][0]['command'])->toContain('guard-git.sh');
});

it('aprova o MCP do Boost pelo nome declarado em .mcp.json', function(): void {
    $mcp = json_decode((string) file_get_contents(hooksRoot() . '/.mcp.json'), true, 512, JSON_THROW_ON_ERROR);

    $declared = array_keys($mcp['mcpServers']);

    foreach ($declared as $server) {
        expect(hooksSettings()['enabledMcpjsonServers'] ?? [])->toContain($server);
    }
});

it('liga o plugin de segurança com o modelo de review fixado', function(): void {
    $settings = hooksSettings();

    expect($settings['enabledPlugins']['security-guidance@claude-plugins-official'] ?? null)->toBeTrue();
    expect($settings['env']['SECURITY_REVIEW_MODEL'] ?? '')->toMatch('/^claude-[a-z0-9-]+$/');
});

it('o .gitignore cobre o estado do gate e os arquivos locais do agente', function(): void {
    $lines = preg_split('/\R/', (string) file_get_contents(hooksRoot() . '/.gitignore'));

    foreach (['.claude/.ci-gate/', '.claude/settings.local.json', '.claude/claude-security-guidance.local.md'] as $pattern) {
        expect(in_array($pattern, $lines, true))->toBeTrue("{$pattern} precisa estar no .gitignore");
    }
});
