<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| AGENTS.md é a fonte única de guidelines, e o CLAUDE.md a importa
|--------------------------------------------------------------------------
|
| O Laravel Boost gera o AGENTS.md (versões da stack, skills, regras de
| framework e a seção "Project Rules", que manda toda ferramenta abrir
| .ai/rules/index.md antes de editar). Cursor, Codex e Copilot já leem esse
| arquivo por default; o Claude Code lê CLAUDE.md, não AGENTS.md — então o
| CLAUDE.md começa com `@AGENTS.md`, e o resto dele é só o que é específico
| deste boilerplate. Antes disso, as 280 linhas que o CLAUDE.md dizia que
| "valem integralmente" nunca entravam no contexto.
|
| Contratos e o modo de falha que cada um impede:
|
| 1. o CLAUDE.md importa o AGENTS.md na primeira linha útil — sem o import,
|    o Claude Code volta a trabalhar sem as guidelines;
| 2. o AGENTS.md foi gerado por um Boost que conhece .ai/rules ("Project
|    Rules") — sem essa seção nenhuma ferramenta além do Claude acha as regras;
| 3. só o AGENTS.md carrega o bloco <laravel-boost-guidelines>: a cópia para
|    Cursor e Copilot que Boosts antigos escreviam apodrece em silêncio, e o
|    CLAUDE.md não pode ganhar o bloco por append;
| 4. config/boost.php aponta as guidelines do agente claude_code para o
|    AGENTS.md — o default é CLAUDE.md, e o GuidelineWriter APENDE o bloco ao
|    fim do arquivo quando não acha o marcador;
| 5. as skills espelhadas existem exatamente nos diretórios que o Boost
|    instalado escreve, com o mesmo conjunto do boost.json, e o diretório do
|    Codex antigo (.codex/skills) não fica órfão.
|
*/

function instructionsRoot(): string
{
    return dirname(__DIR__, 3);
}

/**
 * @return list<string>
 */
function instructionsSkillDirs(string $path): array
{
    $dirs = glob(instructionsRoot() . '/' . $path . '/*', GLOB_ONLYDIR) ?: [];

    $names = array_map('basename', $dirs);
    sort($names);

    return $names;
}

it('o CLAUDE.md importa o AGENTS.md na primeira linha útil', function(): void {
    $lines = preg_split('/\R/', trim((string) file_get_contents(instructionsRoot() . '/CLAUDE.md')));

    expect($lines[0] ?? null)->toBe('@AGENTS.md');
});

it('o AGENTS.md gerado tem a seção Project Rules apontando para .ai/rules/index.md', function(): void {
    $agents = (string) file_get_contents(instructionsRoot() . '/AGENTS.md');

    expect($agents)->toContain('<laravel-boost-guidelines>');
    expect($agents)->toContain('## Project Rules');
    expect($agents)->toContain('.ai/rules/index.md');
});

it('só o AGENTS.md carrega o bloco de guidelines do Boost', function(): void {
    $root = instructionsRoot();

    expect(file_exists($root . '/.cursor/rules/laravel-boost.mdc'))
        ->toBeFalse('.cursor/rules/laravel-boost.mdc é cópia órfã do AGENTS.md — o Boost 2.5 escreve AGENTS.md para o Cursor');
    expect(file_exists($root . '/.github/copilot-instructions.md'))
        ->toBeFalse('.github/copilot-instructions.md é cópia órfã do AGENTS.md — o Boost 2.5 escreve AGENTS.md para o Copilot');
    expect(str_contains((string) file_get_contents($root . '/CLAUDE.md'), '<laravel-boost-guidelines>'))
        ->toBeFalse('o bloco de guidelines foi apendado ao CLAUDE.md — confira agents.claude_code.guidelines_path em config/boost.php');
});

it('config/boost.php aponta as guidelines do claude_code para o AGENTS.md', function(): void {
    $path = instructionsRoot() . '/config/boost.php';

    expect(file_exists($path))->toBeTrue('config/boost.php precisa existir para sobrescrever o default CLAUDE.md do agente claude_code');

    $config = require $path;

    expect($config['agents']['claude_code']['guidelines_path'] ?? null)->toBe('AGENTS.md');
});

it('as skills espelhadas seguem os diretórios do Boost instalado, sem órfão do Codex antigo', function(): void {
    $boost = json_decode((string) file_get_contents(instructionsRoot() . '/boost.json'), true, 512, JSON_THROW_ON_ERROR);

    $expected = $boost['skills'];
    sort($expected);

    expect($boost['agents'])->toContain('claude_code');

    foreach (['.claude/skills', '.agents/skills', '.cursor/skills', '.github/skills'] as $dir) {
        expect(instructionsSkillDirs($dir))->toBe($expected, "{$dir} diverge do boost.json — rode php artisan boost:update");
    }

    expect(is_dir(instructionsRoot() . '/.codex/skills'))
        ->toBeFalse('.codex/skills é o caminho de skills de um Boost antigo; o Codex lê .agents/skills');
});
