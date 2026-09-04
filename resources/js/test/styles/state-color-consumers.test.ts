// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * Os tokens de estado têm dois conjuntos com papéis diferentes, e o erro que
 * este teste pega é o de misturar os papéis no call site:
 *
 * - o SÓLIDO (`bg-X`) leva o rótulo do próprio par (`text-X-foreground`),
 *   que é navy no escuro e branco no claro. `text-white` cru em cima dele
 *   dava 2.69:1 no botão destrutivo escuro — e era exatamente o que o
 *   `Button` e o `Badge` vendorizados escreviam;
 * - `text-X-foreground` só faz sentido SOBRE `bg-X`. Solto, é texto branco
 *   sobre o canvas branco: foi assim que a variante `destructive` do `Alert`
 *   e o item `destructive` do `DropdownMenu` ficaram invisíveis no tema
 *   claro por meses. Texto em cor de estado sobre canvas/card/popover é
 *   `text-state-X`, o `fg` do trio.
 *
 * Teste de fonte, não de DOM: o defeito é de escrita e alcança telas que
 * ninguém monta em teste de componente.
 */

const jsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function applicationSourceFiles(dir: string = jsRoot): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
            return entry.name === 'test' ? [] : applicationSourceFiles(full);
        }

        return /\.tsx?$/.test(entry.name) ? [full] : [];
    });
}

/** Comentário fora: crase em prosa (`text-x`) não é template literal. */
function stripComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/** Toda string literal de um arquivo — é onde className vive. */
function stringLiterals(source: string): string[] {
    return [...stripComments(source).matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map((m) => m[1] ?? m[2] ?? m[3]);
}

const estados = 'success|warning|info|destructive';
const files = applicationSourceFiles();

describe('quem usa cor de estado usa o token do papel certo', () => {
    it('sólido de estado leva o rótulo do par, nunca text-white/text-black', () => {
        const infratores = files.flatMap((file) =>
            stringLiterals(readFileSync(file, 'utf8'))
                .filter((literal) => new RegExp(`(^|[\\s:])bg-(${estados})(?![\\w/-])`).test(literal))
                .filter((literal) => /(^|[\s:])text-(white|black)(?![\w/-])/.test(literal))
                .map((literal) => `${relative(jsRoot, file)}: "${literal.slice(0, 80)}"`),
        );

        expect(infratores).toEqual([]);
    });

    it('text-X-foreground só aparece junto do bg-X sólido correspondente', () => {
        const infratores = files.flatMap((file) =>
            stringLiterals(readFileSync(file, 'utf8')).flatMap((literal) =>
                [...literal.matchAll(new RegExp(`text-(${estados})-foreground(?![\\w-])`, 'g'))]
                    .map((m) => m[1])
                    .filter((estado) => !new RegExp(`(^|[\\s:])bg-${estado}(?![\\w/-])`).test(literal))
                    .map((estado) => `${relative(jsRoot, file)}: text-${estado}-foreground sem bg-${estado} em "${literal.slice(0, 80)}"`),
            ),
        );

        expect(infratores).toEqual([]);
    });

    /*
     * Catraca: os arquivos que já falam em token não voltam a falar em
     * paleta. A lista só cresce — tirar um arquivo daqui é regressão, e
     * arquivo novo de estado nasce dentro dela.
     */
    const limpos = [
        'components/input-error.tsx',
        'components/delete-user.tsx',
        'components/users/user-actions-menu.tsx',
        'components/ui/alert.tsx',
        'components/ui/badge.tsx',
        'components/ui/button.tsx',
        'components/ui/dropdown-menu.tsx',
    ];

    it.each(limpos)('%s pinta estado com token, não com literal da paleta', (file) => {
        const source = readFileSync(join(jsRoot, file), 'utf8');
        const literais = [...source.matchAll(/(?:text|bg|border|ring)-(?:red|rose|green|emerald|amber|orange|yellow|sky|blue)-\d+/g)].map(
            (m) => m[0],
        );

        expect(literais).toEqual([]);
    });
});
