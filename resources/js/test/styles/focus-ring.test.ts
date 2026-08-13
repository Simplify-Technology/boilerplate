// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/*
 * A metade em className do contrato de foco. A outra metade — o valor dos
 * tokens — está em styles/theme-tokens.test.ts.
 *
 * Por que existe: os primitivos desligam o anel nativo do browser com
 * `outline-none` e desenham o próprio com `focus-visible:ring-ring`. Só que o
 * anel vinha com o modificador de opacidade `/50`, e o companheiro
 * `focus-visible:border-ring` pinta só a COR da borda — o preflight do
 * Tailwind deixa `border-width: 0`, então em cinco das seis variantes de
 * Button (`default`, `destructive`, `secondary`, `ghost`, `link`) não há borda
 * nenhuma e o halo de 50% era o indicador inteiro.
 *
 * A medição que fecha o caso: composto a 50% sobre branco, NENHUM tom da
 * família ciano da marca alcança os 3:1 da WCAG 1.4.11 — o teto é ~3.08:1, e
 * só com um azul quase preto. Não é escolha de gosto: com `outline-none` no
 * lugar, o anel de foco tem de render em opacidade cheia.
 *
 * O anel de erro (`ring-destructive/20|40`) fica de fora de propósito: ele
 * acompanha `aria-invalid:border-destructive` num campo que TEM borda, e sua
 * calibragem é outro candidato.
 */

const jsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

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

const sources = applicationSourceFiles().map((path) => ({
    path: relative(jsRoot, path),
    body: readFileSync(path, 'utf8'),
}));

/**
 * A lista existiu por uma fatia só. `ui/navigation-menu.tsx` usava um terceiro
 * idioma de foco, ainda mais fraco (`ring-ring/10 dark:ring-ring/20` como
 * brilho e `outline-ring/50` de 1px carregando o contraste), e ficou de fora
 * da correção por ser **código morto**: a cadeia
 * `app-header-layout` → `app-header` → `navigation-menu` era órfã inteira.
 *
 * A poda de código morto apagou os três arquivos, então a lista esvaziou —
 * exatamente como a asserção de "entrada obsoleta" abaixo previa. Ela fica
 * aqui, vazia, porque o mecanismo (isentar um arquivo e ser cobrado a remover
 * a isenção) é o que impede a próxima exceção de virar permanente.
 */
const MORTOS_CONHECIDOS: string[] = [];

describe('anel de foco em opacidade cheia', () => {
    it('enxerga a árvore do front e acha quem desenha anel de foco', () => {
        // Controle positivo: sem ele, os testes abaixo passariam vacuamente no
        // dia em que o glob quebrasse ou a classe fosse renomeada.
        expect(sources.length).toBeGreaterThan(50);
        expect(sources.filter(({ body }) => body.includes('focus-visible:ring-ring')).length).toBeGreaterThanOrEqual(8);
    });

    it('não pinta o anel de foco com opacidade fracionária', () => {
        const offenders = sources
            .filter(({ body }) => /ring-ring\//.test(body))
            .map(({ path }) => path)
            .filter((path) => !MORTOS_CONHECIDOS.includes(path));

        expect(offenders).toEqual([]);
    });

    it('não carrega entrada obsoleta na lista de mortos conhecidos', () => {
        const aindaInfratores = sources.filter(({ body }) => /ring-ring\//.test(body)).map(({ path }) => path);
        const obsoletas = MORTOS_CONHECIDOS.filter((path) => !aindaInfratores.includes(path));

        expect(obsoletas).toEqual([]);
    });

    it('não deixa quem apaga o outline nativo sem indicador de foco no lugar', () => {
        // `outline-none` remove o indicador do browser. Quem remove, repõe — é
        // a recomendação do próprio Tailwind e o que a SC 2.4.7 cobra. Aceita
        // qualquer reposição visível (anel ou outline), não só a desta casa:
        // o que não pode existir é elemento que apaga e não devolve nada.
        const offenders = sources
            .filter(({ body }) => /\boutline-none\b/.test(body))
            .filter(({ body }) => !/focus-visible:(ring|outline)-/.test(body))
            .map(({ path }) => path);

        expect(offenders).toEqual([]);
    });
});
