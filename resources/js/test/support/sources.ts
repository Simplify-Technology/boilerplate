import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Um único caminhante de fonte para os testes estáticos. Existia uma cópia por
 * teste (`focus-ring`, `link-button-nesting`, `state-color-consumers`), e a
 * terceira era o limite: o próximo copy-paste vira dívida garantida.
 */

/** `resources/js` */
export const jsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Raiz do projeto (onde vivem package.json, composer.json, vite.config.ts). */
export const projectRoot = resolve(jsRoot, '../..');

/** Arquivos de aplicação: tudo em resources/js exceto os próprios testes. */
export function applicationSourceFiles(pattern: RegExp = /\.tsx?$/, dir: string = jsRoot): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);

        if (entry.isDirectory()) {
            return entry.name === 'test' ? [] : applicationSourceFiles(pattern, full);
        }

        return pattern.test(entry.name) ? [full] : [];
    });
}

export type Source = { path: string; body: string };

/** Caminho relativo a `resources/js` + conteúdo, para asserções de fonte. */
export function readSources(pattern?: RegExp): Source[] {
    return applicationSourceFiles(pattern).map((path) => ({ path: relative(jsRoot, path), body: readFileSync(path, 'utf8') }));
}
