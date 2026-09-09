<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| Regras de casa: uma fonte agnóstica, projetada para cada ferramenta
|--------------------------------------------------------------------------
|
| As convenções do projeto vivem em .ai/rules (formato do Laravel Boost:
| frontmatter `paths:` + markdown), a única fonte que qualquer ferramenta ou
| modelo consegue ler — o AGENTS.md manda abrir o index.md antes de editar.
| Ferramenta que carrega regra por caminho recebe uma PROJEÇÃO dessa fonte,
| nunca uma cópia: o Claude Code lê .claude/rules recursivamente e segue
| symlink, então .claude/rules/conventions aponta para ../../.ai/rules e as
| 24 regras passam a carregar sozinhas quando o arquivo casado é aberto.
|
| Quatro contratos, cada um com o modo de falha que ele impede:
|
| 1. a projeção existe, é symlink RELATIVO (sobrevive a clone em outro path)
|    e resolve para .ai/rules — sem ela o Claude não carrega regra nenhuma;
| 2. toda regra fora do index.md tem `paths:` — regra sem escopo carrega em
|    toda sessão de todo mundo, e o index gerado pelo Boost nem a lista;
| 3. o index.md lista exatamente os arquivos com `paths:` — quem escreve regra
|    à mão em vez de usar `record-rule` deixa o índice mentindo;
| 4. .cursor/rules não guarda regra de casa — só o que o Boost gera. Regra
|    escrita ali é invisível a toda outra ferramenta e vira cópia divergente.
|
| Regra citando ferramenta ou modelo pelo nome quebra o contrato de
| agnosticismo: a mesma regra tem de valer para quem quer que a leia. (O
| nome próprio da IDE é checado com maiúscula — "o cursor do campo" é texto.)
|
*/

function agentToolingRoot(): string
{
    return dirname(__DIR__, 3);
}

/**
 * @return list<string> caminhos absolutos de .ai/rules/*.md, exceto index.md
 */
function agentToolingRuleFiles(): array
{
    $files = glob(agentToolingRoot() . '/.ai/rules/*.md') ?: [];

    $files = array_values(array_filter(
        $files,
        static fn(string $file): bool => basename($file) !== 'index.md',
    ));

    sort($files);

    return $files;
}

/**
 * @return list<string> globs declarados no frontmatter `paths:` do arquivo
 */
function agentToolingRulePaths(string $file): array
{
    $content = (string) file_get_contents($file);

    if (preg_match('/\A---\n(.*?)\n---\n/s', $content, $frontmatter) !== 1) {
        return [];
    }

    preg_match_all('/^\s*-\s*[\'"]?([^\'"\n]+?)[\'"]?\s*$/m', $frontmatter[1], $paths);

    return $paths[1];
}

it('projeta .ai/rules para o Claude por symlink relativo em .claude/rules/conventions', function(): void {
    $link = agentToolingRoot() . '/.claude/rules/conventions';

    expect(is_link($link))->toBeTrue("{$link} precisa ser um symlink para ../../.ai/rules");
    expect(readlink($link))->toBe('../../.ai/rules');
    expect(realpath($link))->toBe(realpath(agentToolingRoot() . '/.ai/rules'));
});

it('toda regra fora do index.md declara paths: no frontmatter', function(): void {
    $files = agentToolingRuleFiles();

    expect($files)->not->toBeEmpty();

    foreach ($files as $file) {
        expect(agentToolingRulePaths($file))
            ->not->toBeEmpty(basename($file) . ' precisa de frontmatter paths: — regra sem escopo carrega sempre e o index não a lista');
    }
});

it('o index.md gerado lista exatamente os arquivos de regra com paths', function(): void {
    $index = (string) file_get_contents(agentToolingRoot() . '/.ai/rules/index.md');

    preg_match_all('/^\|[^|]*\|\s*\.ai\/rules\/([^|\s]+)\s*\|$/m', $index, $rows);

    $listed = $rows[1];
    sort($listed);

    $expected = array_map(
        static fn(string $file): string => basename($file),
        agentToolingRuleFiles(),
    );

    expect($listed)->toBe($expected);
});

it('.cursor/rules não guarda regra de casa, só o que o Boost gera', function(): void {
    $files = glob(agentToolingRoot() . '/.cursor/rules/*.mdc') ?: [];

    foreach ($files as $file) {
        expect(str_contains((string) file_get_contents($file), '<laravel-boost-guidelines>'))
            ->toBeTrue(basename($file) . ' é regra escrita à mão em formato de uma ferramenta só; mova para .ai/rules');
    }
});

it('nenhuma regra cita ferramenta ou modelo pelo nome', function(): void {
    foreach (agentToolingRuleFiles() as $file) {
        expect((string) file_get_contents($file))
            ->not->toMatch('/\b(claude|copilot|codex|openai|gemini|gpt-?\d)\b|\.cursor\b|\bCursor\b/', basename($file) . ' cita uma ferramenta ou modelo — a regra tem de valer para qualquer leitor');
    }
});
