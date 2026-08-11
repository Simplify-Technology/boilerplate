// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * A outra metade da defesa de lib/impersonation.ts.
 *
 * O módulo garante que quem passa por ele invalida o cache de prefetch. Só que
 * isso não impede ninguém de chamar `router.post(route('users.impersonate'))`
 * direto e reabrir o buraco — foi exatamente assim que os três call sites
 * existentes nasceram, cada um numa data, nenhum sabendo do outro.
 *
 * Então o contrato é: as rotas de impersonation só são nomeadas dentro do
 * módulo. Uma quarta tela que precise trocar de identidade importa
 * startImpersonation/stopImpersonation e herda o flush de graça.
 */

const jsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const OWNER = 'lib/impersonation.ts';

/**
 * Arquivos de aplicação: tudo em resources/js exceto os próprios testes.
 */
function applicationSourceFiles(dir: string = jsRoot): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
            return entry.name === 'test' ? [] : applicationSourceFiles(full);
        }

        return /\.tsx?$/.test(entry.name) ? [full] : [];
    });
}

it('actually reads the frontend source tree', () => {
    expect(applicationSourceFiles().length).toBeGreaterThan(50);
});

describe('impersonation route ownership', () => {
    it('keeps the impersonation routes named only inside the module that flushes the cache', () => {
        const offenders = applicationSourceFiles()
            .map((path) => ({ path: relative(jsRoot, path), body: readFileSync(path, 'utf8') }))
            .filter(({ path, body }) => path !== OWNER && body.includes('users.impersonate'))
            .map(({ path }) => path);

        expect(offenders).toEqual([]);
    });

    it('keeps the module itself flushing the cache', () => {
        const body = readFileSync(join(jsRoot, OWNER), 'utf8');

        expect(body).toContain('router.flushAll()');
        expect(body.match(/router\.flushAll\(\)/g)).toHaveLength(2);
    });
});
