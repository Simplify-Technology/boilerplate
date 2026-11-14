import { execFileSync } from 'node:child_process';

/**
 * Runs an external command; on failure prints the command and Git diagnostics,
 * then exits with status 1 so an unreadable index never permits a commit.
 *
 * @param {string} command
 * @param {string[]} [args]
 * @returns {string}
 */
function execFileSyncOrExit(command, args = []) {
    const safeArgs = Array.isArray(args) ? args : [];

    try {
        return execFileSync(command, safeArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
        process.stderr.write(`pre-commit: falha ao executar ${command} ${safeArgs.join(' ')}.\n`);
        process.stderr.write(`${error.message}\n`);
        if (error.stderr) {
            process.stderr.write(String(error.stderr));
        }
        process.stderr.write('Não foi possível verificar o índice do Git; corrija o erro antes de tentar novamente.\n');
        process.exit(1);
    }
}

const rootPlaceholders = [
    '.bashrc',
    '.bash_profile',
    '.zshrc',
    '.zprofile',
    '.profile',
    '.gitconfig',
    '.gitmodules',
    '.mcp.json',
    '.ripgreprc',
];
const claudePlaceholders = [
    'agents',
    'commands',
    'hooks',
    'skills',
    'workflows',
    'routines',
    'output-styles',
    'launch.json',
    'loop.md',
    'scheduled_tasks.json',
    'settings.json',
    'settings.local.json',
];
const knownPlaceholders = new Set([
    ...rootPlaceholders,
    ...claudePlaceholders.map((name) => `.claude/${name}`),
    ...claudePlaceholders.map((name) => `.claude/.claude/${name}`),
]);

// NUL separators preserve filenames; disabling renames also checks newly introduced paths.
const additions = execFileSyncOrExit('git', ['diff', '--cached', '--name-only', '--diff-filter=A', '--no-renames', '-z'])
    .split('\0')
    .filter((path) => knownPlaceholders.has(path));

// Read the staged object, never the working tree (including partially staged files).
const placeholders = additions.filter((path) => execFileSyncOrExit('git', ['cat-file', '-s', `:${path}`]).trim() === '0');

if (placeholders.length > 0) {
    process.stderr.write('pre-commit: novos arquivos vazios no índice parecem placeholders do sandbox:\n');
    for (const path of placeholders) {
        process.stderr.write(`  - ${JSON.stringify(path)}\n`);
    }
    process.stderr.write(
        'Antes de continuar, inspecione cada caminho e seu conteúdo staged (git show :caminho).\n' +
            'Se confirmado como placeholder, retire somente esse arquivo do índice com git rm --cached -- caminho; ' +
            'remova do disco apenas o arquivo confirmado, se necessário.\n' +
            'Se for configuração legítima, adicione seu conteúdo ao índice com git add -- caminho.\n',
    );
    process.exit(1);
}
