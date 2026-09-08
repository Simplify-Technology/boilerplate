// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectRoot, readSources } from '../support/sources';

/*
 * Dependência de runtime sem importador é peso no install, superfície de
 * supply-chain e ruído no dependabot — e nenhum gate a denuncia, porque o
 * bundler só reclama do que falta, nunca do que sobra. Foi assim que
 * `@radix-ui/react-navigation-menu` sobreviveu à poda do header (#100) e
 * `@headlessui/react` atravessou o starter kit inteiro sem um import.
 *
 * Dois cuidados que a medição ingênua erra:
 * - os primitivos vendorizados do shadcn importam com aspas DUPLAS; uma regex
 *   de aspas simples acusa 13 pacotes vivos como mortos, e alguém "conserta"
 *   desinstalando dependência viva;
 * - o starter kit da Laravel põe tooling de build em `dependencies` (vite,
 *   plugins, `globals`, `concurrently`, `@types/*`) para o install de produção
 *   ainda buildar. O consumidor desses é config ou script, não `resources/`.
 */

const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
const dependencies = Object.keys(pkg.dependencies);

const corpusJs = readSources()
    .map(({ body }) => body)
    .join('\n');
const corpusCss = readdirSync(join(projectRoot, 'resources/css'))
    .filter((name) => name.endsWith('.css'))
    .map((name) => readFileSync(join(projectRoot, 'resources/css', name), 'utf8'))
    .join('\n');
const corpusConfig = ['vite.config.ts', 'eslint.config.js', 'tsconfig.json', 'composer.json']
    .map((name) => readFileSync(join(projectRoot, name), 'utf8'))
    .join('\n');

const escape = (dep: string) => dep.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** `from 'dep'`, `from "dep/sub"`, `import('dep')`, `import 'dep'` — qualquer aspa. */
function importedByJs(dep: string): boolean {
    return new RegExp(`(?:from\\s+|import\\s+|import\\(\\s*)['"]${escape(dep)}(?:/|['"])`).test(corpusJs);
}

/** `@import 'dep/…'`, `@plugin 'dep'`, `@source '../node_modules/dep'`. */
function usedByCss(dep: string): boolean {
    return new RegExp(`['"](?:\\.\\./)*(?:node_modules/)?${escape(dep)}(?:/|['"])`).test(corpusCss);
}

/** Tooling que o starter põe em `dependencies`: consumido por config ou script. */
function usedByTooling(dep: string): boolean {
    return dep.startsWith('@types/') || new RegExp(`(?<![\\w@/-])${escape(dep)}(?![\\w-])`).test(corpusConfig);
}

const hasConsumer = (dep: string) => importedByJs(dep) || usedByCss(dep) || usedByTooling(dep);

/*
 * Dívida datada: pacotes sem consumidor cuja remoção espera a fatia de deps
 * (tirar do package.json muda o pnpm-lock.yaml, e uma PR do dependabot aberta
 * sobre o mesmo lockfile conflita). A entrada some no mesmo commit que remove
 * o pacote — a asserção de simetria abaixo cobra isso.
 */
const DIVIDA_SEM_CONSUMIDOR: Record<string, string> = {
    '@radix-ui/react-navigation-menu':
        '2026-09-08 — resíduo da poda de app-header/navigation-menu (#100); sai na fatia de deps depois de #128 mesclar',
    '@headlessui/react': '2026-09-08 — zero importadores desde o starter kit; sai na mesma fatia de deps',
};

describe('toda dependência de runtime tem quem a consuma', () => {
    it('enxerga o package.json e a árvore do front', () => {
        // Controle positivo: sem ele, o teste passaria vacuamente no dia em que
        // o caminho do package.json ou o caminhante de fonte quebrasse.
        expect(dependencies.length).toBeGreaterThanOrEqual(20);
        expect(readSources().length).toBeGreaterThan(50);
        expect(importedByJs('react')).toBe(true);
        expect(usedByCss('tailwindcss')).toBe(true);
        expect(usedByTooling('vite')).toBe(true);
    });

    it('não carrega dependência sem importador fora da dívida datada', () => {
        const semConsumidor = dependencies.filter((dep) => !hasConsumer(dep)).filter((dep) => !(dep in DIVIDA_SEM_CONSUMIDOR));

        expect(semConsumidor).toEqual([]);
    });

    it('mantém a dívida honesta: entrada é pacote declarado e ainda sem consumidor', () => {
        for (const [dep, motivo] of Object.entries(DIVIDA_SEM_CONSUMIDOR)) {
            expect(dependencies, `${dep} saiu do package.json — apague a entrada da dívida (${motivo})`).toContain(dep);
            expect(hasConsumer(dep), `${dep} ganhou consumidor — apague a entrada da dívida (${motivo})`).toBe(false);
        }
    });
});
