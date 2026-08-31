// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * A metade de fora de lib/toast-config.ts.
 *
 * `toast.promise(promise, mensagens)` com dois argumentos NÃO herda severidade
 * de lugar nenhum, e o motivo está no `dist/` de `react-hot-toast@2.6.0`:
 *
 *   createToast = (message, type, opts) => ({ …, ariaProps: { role: 'status',
 *     'aria-live': 'polite' }, …opts })
 *   useToaster   = toasts.map(t => ({ …defaults, …defaults[t.type], …t }))
 *
 * O `ariaProps` polite é gravado no PRÓPRIO toast, e o toast é o último spread
 * do merge — então ele vence o `toastOptions` do `<Toaster>`. Não existe
 * ajuste no provider que alcance isto: o único canal é o argumento por
 * chamada. Sem ele, o toast de ERRO de toda ação assíncrona chega `polite`,
 * anulando em silêncio a decisão de severidade da PR #102.
 *
 * O mesmo vale para cor: sem opções, o disco cai nos defaults da lib
 * (`#61d345` no sucesso, que dá 1.92:1 sobre o card claro — o pior contraste
 * da casa) e a borda esquerda por variante some.
 *
 * Por isso o contrato é: quem chama `toast.promise` passa `toastPromiseOptions`.
 */

const jsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const OWNER = 'lib/toast-config.ts';

const OPTIONS_EXPORT = 'toastPromiseOptions';

/** Arquivos de aplicação: tudo em resources/js exceto os próprios testes. */
function applicationSourceFiles(dir: string = jsRoot): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
            return entry.name === 'test' ? [] : applicationSourceFiles(full);
        }

        return /\.tsx?$/.test(entry.name) ? [full] : [];
    });
}

/** Arquivos que chamam `toast.promise`, com o corpo já lido. */
function callSites(): Array<{ path: string; body: string }> {
    return applicationSourceFiles()
        .map((path) => ({ path: relative(jsRoot, path), body: readFileSync(path, 'utf8') }))
        .filter(({ body }) => body.includes('toast.promise('));
}

describe('toast.promise não escapa da severidade', () => {
    it('actually reads the frontend source tree', () => {
        expect(applicationSourceFiles().length).toBeGreaterThan(50);
    });

    it('encontra os call sites que o contrato governa', () => {
        // Se este número cair para zero, os dois testes abaixo passam vazios e
        // a guarda vira decoração.
        const total = callSites().reduce((soma, { body }) => soma + (body.match(/toast\.promise\(/g) ?? []).length, 0);

        expect(total).toBeGreaterThanOrEqual(6);
    });

    it('faz todo call site importar as opções de severidade', () => {
        const offenders = callSites()
            .filter(({ body }) => !body.includes(OPTIONS_EXPORT))
            .map(({ path }) => path);

        expect(offenders).toEqual([]);
    });

    it('faz toda chamada passar o terceiro argumento', () => {
        // O terceiro argumento é o último do `toast.promise(`, então a marca
        // observável é `toastPromiseOptions` fechando a chamada. Uma chamada a
        // mais no arquivo sem a opção deixa as contagens desiguais.
        const offenders = callSites()
            .map(({ path, body }) => ({
                path,
                chamadas: (body.match(/toast\.promise\(/g) ?? []).length,
                opcoes: (body.match(new RegExp(`${OPTIONS_EXPORT},?\\s*\\n\\s*\\);`, 'g')) ?? []).length,
            }))
            .filter(({ chamadas, opcoes }) => chamadas !== opcoes);

        expect(offenders).toEqual([]);
    });

    it('mantém as opções no módulo que já é dono da severidade', () => {
        const body = readFileSync(join(jsRoot, OWNER), 'utf8');

        expect(body).toContain(`export const ${OPTIONS_EXPORT}`);
    });
});
