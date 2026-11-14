<?php

declare(strict_types = 1);

use Illuminate\Filesystem\Filesystem;
use Symfony\Component\Process\Process;

function sandboxNodeBinary(): string
{
    static $binary;

    if ($binary === null) {
        $process = new Process(['node', '-p', 'process.execPath'], dirname(__DIR__, 3));
        $process->mustRun();
        $binary = trim($process->getOutput());
    }

    return $binary;
}

beforeEach(function(): void {
    $this->sandboxRepository = sys_get_temp_dir() . '/sandbox-placeholders-' . bin2hex(random_bytes(8));
    mkdir($this->sandboxRepository);

    $this->sandboxEnvironment = [
        'HOME'                => $this->sandboxRepository,
        'GIT_CONFIG_NOSYSTEM' => '1',
        'GIT_CONFIG_GLOBAL'   => '/dev/null',
        'SKIP_GIT_HOOKS'      => false,
        'PATH'                => $this->sandboxRepository . '/bin:' . getenv('PATH'),
    ];

    foreach (array_keys(getenv()) as $name) {
        if (str_starts_with($name, 'GIT_') && !array_key_exists($name, $this->sandboxEnvironment)) {
            $this->sandboxEnvironment[$name] = false;
        }
    }

    $this->sandboxRun = function(array $command): Process {
        $process = new Process($command, $this->sandboxRepository, $this->sandboxEnvironment);
        $process->run();

        return $process;
    };
    $this->sandboxGit = function(array $arguments): Process {
        $process = ($this->sandboxRun)(['git', ...$arguments]);
        expect($process->isSuccessful())->toBeTrue($process->getErrorOutput());

        return $process;
    };
    $this->sandboxWrite = function(string $path, string $content): void {
        $absolutePath = $this->sandboxRepository . '/' . $path;
        (new Filesystem())->ensureDirectoryExists(dirname($absolutePath));
        file_put_contents($absolutePath, $content);
    };
    $this->sandboxStage = function(string $path, string $content = ''): void {
        ($this->sandboxWrite)($path, $content);
        ($this->sandboxGit)(['add', '--', $path]);
    };

    ($this->sandboxGit)(['init', '--quiet', '--template=']);
    ($this->sandboxGit)(['config', 'user.name', 'Sandbox Test']);
    ($this->sandboxGit)(['config', 'user.email', 'sandbox@example.test']);
    ($this->sandboxGit)(['config', 'core.hooksPath', '/dev/null']);
    ($this->sandboxGit)(['config', 'commit.gpgSign', 'false']);

    $root = dirname(__DIR__, 3);
    ($this->sandboxWrite)('.husky/pre-commit', (string) file_get_contents($root . '/.husky/pre-commit'));
    $guard = $root . '/scripts/git/check-sandbox-placeholders.mjs';

    if (is_file($guard)) {
        ($this->sandboxWrite)('scripts/git/check-sandbox-placeholders.mjs', (string) file_get_contents($guard));
    }

    ($this->sandboxWrite)('bin/pnpm', "#!/bin/sh\nprintf 'lint-staged reached\\n'\n");
    chmod($this->sandboxRepository . '/bin/pnpm', 0755);
    symlink(sandboxNodeBinary(), $this->sandboxRepository . '/bin/node');
    $this->sandboxHook = fn(): Process => ($this->sandboxRun)(['sh', '.husky/pre-commit']);
});

afterEach(function(): void {
    (new Filesystem())->deleteDirectory($this->sandboxRepository);
});

it('rejeita placeholder novo vazio antes de executar lint-staged', function(): void {
    ($this->sandboxStage)('.bashrc');
    $indexBefore = ($this->sandboxGit)(['ls-files', '--stage', '-z'])->getOutput();

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe(1);
    expect($result->getErrorOutput())->toContain('.bashrc', 'inspecione', 'confirmado');
    expect($result->getOutput())->not->toContain('lint-staged reached');
    expect(($this->sandboxGit)(['ls-files', '--stage', '-z'])->getOutput())->toBe($indexBefore);
    expect(file_get_contents($this->sandboxRepository . '/.bashrc'))->toBe('');
});

it('rejeita somente os caminhos conhecidos quando são novos e vazios', function(string $path): void {
    ($this->sandboxStage)($path);

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe(1);
    expect($result->getErrorOutput())->toContain($path);
})->with([
    '.bashrc', '.bash_profile', '.zshrc', '.zprofile', '.profile', '.gitconfig', '.gitmodules', '.mcp.json', '.ripgreprc',
    '.claude/agents', '.claude/commands', '.claude/hooks', '.claude/skills', '.claude/workflows', '.claude/routines',
    '.claude/output-styles', '.claude/launch.json', '.claude/loop.md', '.claude/scheduled_tasks.json',
    '.claude/settings.json', '.claude/settings.local.json',
    '.claude/.claude/agents', '.claude/.claude/commands', '.claude/.claude/hooks', '.claude/.claude/skills',
    '.claude/.claude/workflows', '.claude/.claude/routines', '.claude/.claude/output-styles', '.claude/.claude/launch.json',
    '.claude/.claude/loop.md', '.claude/.claude/scheduled_tasks.json', '.claude/.claude/settings.json', '.claude/.claude/settings.local.json',
]);

it('permite conteúdo real nos caminhos conhecidos', function(string $path): void {
    ($this->sandboxStage)($path, "# Configuração compartilhada\n");

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe(0, $result->getErrorOutput());
    expect($result->getOutput())->toContain('lint-staged reached');
})->with(['.bashrc', '.mcp.json', '.claude/settings.json', '.claude/agents', '.claude/.claude/hooks']);

it('usa o conteúdo staged mesmo quando o working tree diverge', function(string $staged, string $working, int $exitCode): void {
    ($this->sandboxStage)('.bashrc', $staged);
    ($this->sandboxWrite)('.bashrc', $working);

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe($exitCode, $result->getErrorOutput());
    expect(($this->sandboxGit)(['show', ':.bashrc'])->getOutput())->toBe($staged);
    expect(file_get_contents($this->sandboxRepository . '/.bashrc'))->toBe($working);
})->with([
    'index vazio e disco preenchido' => ['', "alias ll='ls -l'\n", 1],
    'index preenchido e disco vazio' => ["alias ll='ls -l'\n", '', 0],
]);

it('permite esvaziar ou remover um arquivo já versionado', function(bool $delete): void {
    ($this->sandboxStage)('.bashrc', "alias ll='ls -l'\n");
    ($this->sandboxGit)(['commit', '--quiet', '-m', 'baseline']);

    if ($delete) {
        ($this->sandboxGit)(['rm', '--', '.bashrc']);
    } else {
        ($this->sandboxStage)('.bashrc');
    }

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe(0, $result->getErrorOutput());
    expect($result->getOutput())->toContain('lint-staged reached');
})->with(['esvaziamento' => false, 'remoção' => true]);

it('permite arquivos vazios fora da lista exata incluindo nomes Unicode e quebras de linha', function(): void {
    foreach (['empty.txt', 'docs/.bashrc', '.claude/hooks/empty.sh', '.claude/worktrees', '.claude/.claude/.claude/hooks', "ação com espaço\ne tab\t.txt"] as $path) {
        ($this->sandboxStage)($path);
    }

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe(0, $result->getErrorOutput());
});

it('identifica todos os placeholders mesmo junto a nomes com quebras de linha', function(): void {
    foreach (["arquivo\n.bashrc", '.bashrc', '.claude/.claude/settings.json', '.zshrc'] as $path) {
        ($this->sandboxStage)($path);
    }

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe(1);
    expect($result->getErrorOutput())->toContain('".bashrc"', '".claude/.claude/settings.json"', '".zshrc"');
    expect($result->getErrorOutput())->not->toContain('"arquivo');
});

it('rejeita novo caminho conhecido mesmo quando Git detectaria uma renomeação', function(): void {
    ($this->sandboxStage)('empty.txt');
    ($this->sandboxGit)(['commit', '--quiet', '-m', 'baseline']);
    ($this->sandboxGit)(['mv', 'empty.txt', '.bashrc']);

    expect(($this->sandboxHook)()->getExitCode())->toBe(1);
});

it('permite índice sem adições', function(): void {
    expect(($this->sandboxHook)()->getExitCode())->toBe(0);
});

it('respeita o índice alternativo selecionado pelo Git', function(string $defaultContent, string $alternateContent, int $exitCode): void {
    ($this->sandboxStage)('.bashrc', $defaultContent);
    $defaultIndex                               = file_get_contents($this->sandboxRepository . '/.git/index');
    $this->sandboxEnvironment['GIT_INDEX_FILE'] = $this->sandboxRepository . '/alternate-index';
    ($this->sandboxStage)('.bashrc', $alternateContent);

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe($exitCode, $result->getErrorOutput());
    expect(file_get_contents($this->sandboxRepository . '/.git/index'))->toBe($defaultIndex);
})->with([
    'somente índice alternativo vazio' => ["# shared config\n", '', 1],
    'somente índice padrão vazio'      => ['', "# shared config\n", 0],
]);

it('interrompe o hook com erro claro fora de um repositório Git', function(): void {
    (new Filesystem())->deleteDirectory($this->sandboxRepository . '/.git');

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe(1);
    expect($result->getErrorOutput())->toContain('git rev-parse', 'repositório');
    expect($result->getOutput())->not->toContain('lint-staged reached');
});

it('interrompe o hook com erro claro se o índice estiver corrompido', function(): void {
    ($this->sandboxStage)('.bashrc');
    file_put_contents($this->sandboxRepository . '/.git/index', 'invalid index');

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe(1);
    expect($result->getErrorOutput())->toContain('git diff', 'index');
    expect($result->getOutput())->not->toContain('lint-staged reached');
});

it('interrompe o hook quando o objeto staged não pode ser lido', function(): void {
    ($this->sandboxStage)('.bashrc');
    $object = trim(($this->sandboxGit)(['rev-parse', ':.bashrc'])->getOutput());
    unlink($this->sandboxRepository . '/.git/objects/' . substr($object, 0, 2) . '/' . substr($object, 2));

    $result = ($this->sandboxHook)();

    expect($result->getExitCode())->toBe(1);
    expect($result->getErrorOutput())->toContain('git cat-file', '.bashrc');
    expect($result->getOutput())->not->toContain('lint-staged reached');
});
