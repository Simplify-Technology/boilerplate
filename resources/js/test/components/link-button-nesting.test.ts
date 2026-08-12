// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * `<button>` é conteúdo interativo, e o HTML proíbe conteúdo interativo dentro
 * de `<a>`. Mesmo assim `<Link><Button>…</Button></Link>` é o jeito que sai
 * naturalmente do dedo, e seis call sites tinham nascido assim.
 *
 * O que o navegador faz com isso não é só teoria: são dois nós focáveis para
 * uma ação só (o Tab para duas vezes), o leitor de tela anuncia link E botão,
 * e num `TooltipTrigger asChild` é o `<a>` que recebe o clone — não o
 * `<Button>` que carrega o rótulo acessível.
 *
 * A forma certa inverte o aninhamento: `<Button asChild><Link/></Button>`. O
 * Slot do Radix funde as props do botão no link, então sai um `<a>` só, com a
 * aparência de botão. O precedente já existia em `pages/errors/error-page.tsx`.
 *
 * Este teste é de fonte, não de DOM, porque o defeito é de escrita: pegar no
 * arquivo custa nada e alcança as telas que ninguém monta em teste de
 * componente. O caso difícil (Tooltip) tem cobertura de DOM em
 * `components/users/user-table-row.test.tsx`.
 */

const jsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function applicationSourceFiles(dir: string = jsRoot): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
            return entry.name === 'test' ? [] : applicationSourceFiles(full);
        }

        return /\.tsx$/.test(entry.name) ? [full] : [];
    });
}

const sources = applicationSourceFiles().map((path) => ({
    path: relative(jsRoot, path),
    body: readFileSync(path, 'utf8'),
}));

/** Ocorrências de `<X …>` seguido direto de `<Y`, tolerando props em várias linhas. */
function nestedIn(body: string, outer: string, inner: string): number {
    return [...body.matchAll(new RegExp(`<${outer}\\b[^>]*>\\s*<${inner}\\b`, 'gs'))].length;
}

describe('aninhamento de link e botão', () => {
    it('enxerga a árvore do front', () => {
        // Controle positivo: sem ele o teste passaria vazio se o glob quebrasse.
        expect(sources.length).toBeGreaterThan(40);
        expect(sources.filter(({ body }) => body.includes('<Button')).length).toBeGreaterThan(10);
    });

    it('não embrulha um Button dentro de um Link', () => {
        const offenders = sources.filter(({ body }) => nestedIn(body, 'Link', 'Button') > 0).map(({ path }) => path);

        expect(offenders).toEqual([]);
    });

    it('não embrulha um Link dentro de um Button sem asChild', () => {
        // O outro lado do mesmo erro: `<Button><Link/></Button>` sem `asChild`
        // produz `<button><a/></button>`, igualmente inválido.
        const offenders = sources
            .filter(({ body }) => [...body.matchAll(/<Button\b[^>]*>\s*<Link\b/gs)].some((m) => !/\basChild\b/.test(m[0])))
            .map(({ path }) => path);

        expect(offenders).toEqual([]);
    });
});
