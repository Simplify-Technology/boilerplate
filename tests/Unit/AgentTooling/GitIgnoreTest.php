<?php

declare(strict_types = 1);

use Illuminate\Filesystem\Filesystem;
use Symfony\Component\Process\Process;

it('keeps local secrets and agent artifacts out of Git while preserving project configuration', function(string $path, bool $ignored): void {
    $directory  = sys_get_temp_dir() . '/boilerplate-gitignore-' . bin2hex(random_bytes(8));
    $filesystem = new Filesystem();
    $filesystem->makeDirectory($directory);
    $gitEnvironment = array_fill_keys(explode("\n", trim((new Process(['git', 'rev-parse', '--local-env-vars']))->mustRun()->getOutput())), false);

    try {
        (new Process(['git', 'init', '--quiet'], $directory, $gitEnvironment))->mustRun();
        $filesystem->copy(dirname(__DIR__, 3) . '/.gitignore', $directory . '/.gitignore');

        $process = new Process(['git', '-c', 'core.excludesFile=/dev/null', 'check-ignore', '--no-index', '--', $path], $directory, $gitEnvironment);
        $process->run();

        expect($process->getExitCode())->toBe($ignored ? 0 : 1, $process->getErrorOutput());
    } finally {
        $filesystem->deleteDirectory($directory);
    }
})->with([
    'environment file'          => ['.env', true],
    'backup'                    => ['.env.bak', true],
    'local overrides'           => ['.env.local', true],
    'old copy'                  => ['.env.old', true],
    'production copy'           => ['.env.production', true],
    'staging copy'              => ['.env.staging', true],
    'nested environment backup' => ['storage/.env.bak', true],
    'environment template'      => ['.env.example', false],
    'execution ledger'          => ['.superpowers/sdd/plan/progress.md', true],
    'agent worktree source'     => ['.claude/worktrees/task/app/Models/User.php', true],
    'agent worktree metadata'   => ['.claude/worktrees/task/.git', true],
    'shared agent settings'     => ['.claude/settings.json', false],
    'shared agent hook'         => ['.claude/hooks/guard-git.sh', false],
    'shared agent command'      => ['.claude/commands/harvest-v2.md', false],
    'MCP configuration'         => ['.mcp.json', false],
    'submodule configuration'   => ['.gitmodules', false],
]);
