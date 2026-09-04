import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contrato do bloco `@theme` de `resources/css/app.css`.
 *
 * Existe por causa de um bug que viveu meses sem ninguém ver: `--color-primary`
 * estava declarado DUAS vezes — uma dentro do `@theme` (`var(--primary)`) e
 * outra num `:root` sem layer (`#1f3c57`). Declaração sem layer vence
 * declaração em `@layer`, então `bg-primary`/`text-primary` resolviam para o
 * mesmo hex nos DOIS temas e o `.dark { --primary }` nunca chegava a
 * utilitário nenhum. `text-primary` no escuro dava 1.28:1.
 *
 * Duas guardas, e a segunda é a que teria pego a regressão que o CONSERTO
 * quase introduziu: com a colisão desfeita, o `--primary` do escuro passou a
 * valer de verdade e o par com `--primary-foreground` caiu para 3.13:1.
 *
 * Desde o trio de estado (`--state-*`), o teste também sabe avaliar
 * `color-mix(in oklab, …)`: os fundos suaves são derivados do sólido por
 * mistura, e um token que o gate não consegue medir é um token sem contrato.
 */

const css = readFileSync(resolve(import.meta.dirname, '../../../css/app.css'), 'utf8');

/** Recorta o corpo de um bloco de primeiro nível pelo seletor. */
function block(selector: string): string {
    const start = css.indexOf(`${selector} {`);

    if (start === -1) {
        throw new Error(`Bloco "${selector}" não encontrado em app.css`);
    }

    const open = css.indexOf('{', start);
    let depth = 0;

    for (let i = open; i < css.length; i++) {
        if (css[i] === '{') depth++;
        if (css[i] === '}') {
            depth--;

            if (depth === 0) return css.slice(open + 1, i);
        }
    }

    throw new Error(`Bloco "${selector}" não fecha`);
}

/** Pares `--nome: valor` de um corpo de bloco, ignorando aninhados. */
function declarations(body: string): Map<string, string> {
    const out = new Map<string, string>();

    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;}]+);/g)) {
        out.set(name, value.trim());
    }

    return out;
}

const themeBody = block('@theme');
const themeVars = declarations(themeBody);
const rootVars = declarations(block(':root'));
const darkVars = declarations(block('.dark'));

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
    const normalized = hex.trim().toLowerCase() === 'white' ? '#ffffff' : hex.trim();
    const raw = normalized.replace('#', '');
    const full = raw.length === 3 ? [...raw].map((c) => c + c).join('') : raw;

    if (!/^[0-9a-f]{6}$/i.test(full)) {
        throw new Error(`"${hex}" não é uma cor que este teste saiba medir (hex ou white)`);
    }

    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
}

function rgbToHex(rgb: Rgb): string {
    return `#${rgb
        .map((c) =>
            Math.round(Math.min(1, Math.max(0, c)) * 255)
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;
}

function linearize(channel: number): number {
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function delinearize(channel: number): number {
    return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

/**
 * sRGB → OKLab (CSS Color 4, matrizes de Björn Ottosson). É o espaço em que o
 * browser interpola `color-mix(in oklab, …)`; a conta aqui reproduz a dele
 * para que a razão medida seja a razão pintada.
 */
function toOklab(hex: string): [number, number, number] {
    const [r, g, b] = hexToRgb(hex).map(linearize);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

    return [
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
}

function fromOklab([L, a, b]: [number, number, number]): string {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

    return rgbToHex(
        [
            4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
        ].map(delinearize) as Rgb,
    );
}

/** `color-mix(in oklab, a p%, b)` com as duas cores opacas. */
function mixOklab(a: string, percent: number, b: string): string {
    const p = percent / 100;
    const [la, aa, ba] = toOklab(a);
    const [lb, ab, bb] = toOklab(b);

    return fromOklab([la * p + lb * (1 - p), aa * p + ab * (1 - p), ba * p + bb * (1 - p)]);
}

/**
 * Resolve um VALOR até um literal: cadeias de `var()` e `color-mix(in oklab)`.
 * Qualquer outra forma (outro espaço de mistura, alpha, `rgb()`…) falha com
 * mensagem: token que o gate não mede não entra.
 */
function resolveValue(value: string, scope: Map<string, string>, seen: Set<string> = new Set()): string {
    const trimmed = value.trim();
    const reference = /^var\(\s*(--[\w-]+)\s*\)$/.exec(trimmed);

    if (reference) {
        const name = reference[1];

        if (seen.has(name)) throw new Error(`Ciclo de var() em ${name}`);

        return resolveToken(name, scope, new Set(seen).add(name));
    }

    const mix = /^color-mix\(in oklab,\s*(.+?)\s+(\d+(?:\.\d+)?)%\s*,\s*(.+)\)$/.exec(trimmed);

    if (mix) {
        return mixOklab(resolveValue(mix[1], scope, seen), Number(mix[2]), resolveValue(mix[3], scope, seen));
    }

    return trimmed;
}

/** Resolve um TOKEN (`--x`) no escopo do tema pedido, caindo no `:root`. */
function resolveToken(name: string, scope: Map<string, string>, seen: Set<string> = new Set()): string {
    const value = scope.get(name) ?? rootVars.get(name);

    if (value === undefined) throw new Error(`Token ${name} não declarado em :root nem no tema`);

    return resolveValue(value, scope, seen);
}

function relativeLuminance(hex: string): number {
    const [r, g, b] = hexToRgb(hex).map(linearize);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
    const [x, y] = [relativeLuminance(a), relativeLuminance(b)];

    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const temas: Array<[string, Map<string, string>]> = [
    ['claro', new Map<string, string>()],
    ['escuro', darkVars],
];

const estados = ['success', 'warning', 'info', 'destructive'] as const;

describe('namespace do @theme', () => {
    it('não declara nenhum --color-* fora do bloco @theme', () => {
        // Esta é a guarda do bug original. `--color-*` é o namespace que o
        // Tailwind usa para gerar utilitário de cor; declarar um deles em
        // qualquer outro lugar do arquivo sombreia o do @theme sem aviso.
        const foraDoTheme = css.replace(themeBody, '');
        const infratores = [...foraDoTheme.matchAll(/^\s*(--color-[\w-]+)\s*:/gm)].map((m) => m[1]);

        expect(infratores).toEqual([]);
    });

    it('mantém a paleta base fora do namespace de utilitário', () => {
        // Os hexes da marca vivem em --brand-*, justamente para não colidirem.
        expect([...rootVars.keys()].filter((k) => k.startsWith('--brand-'))).not.toHaveLength(0);
    });

    it('exporta pelos utilitários apenas tokens semânticos', () => {
        const semLiteral = [...themeVars.entries()].filter(([name]) => name.startsWith('--color-')).filter(([, value]) => !value.startsWith('var('));

        expect(semLiteral).toEqual([]);
    });

    it.each(estados)('exporta o par sólido de %s como utilitário', (estado) => {
        // `text-success`/`bg-warning`/`border-info` não existiam no CSS
        // compilado (0 ocorrências) enquanto `text-destructive` existia; o
        // call site que escrevia `text-success` saía sem cor nenhuma.
        expect(themeVars.get(`--color-${estado}`)).toBe(`var(--${estado})`);
        expect(themeVars.get(`--color-${estado}-foreground`)).toBe(`var(--${estado}-foreground)`);
    });
});

describe('contraste dos pares que viram texto', () => {
    // A tabela é o contrato. Um par novo entra aqui junto com o token.
    const pares: Array<[string, string, string]> = [
        ['primary', '--primary-foreground', '--primary'],
        ['secondary', '--secondary-foreground', '--secondary'],
        ['accent', '--accent-foreground', '--accent'],
        ['muted', '--muted-foreground', '--muted'],
        ['card', '--card-foreground', '--card'],
        ['background/foreground', '--foreground', '--background'],
        /*
         * Os quatro sólidos de estado. `destructive` no escuro morou numa
         * catraca (3.67:1) até o trio `--state-*` separar preenchimento de
         * texto: enquanto o mesmo token servia de fundo de botão E de cor de
         * texto sobre o canvas, nenhum valor único passava nos dois usos.
         */
        ['success', '--success-foreground', '--success'],
        ['warning', '--warning-foreground', '--warning'],
        ['info', '--info-foreground', '--info'],
        ['destructive', '--destructive-foreground', '--destructive'],
    ];

    describe.each(temas)('tema %s', (_tema, scope) => {
        it.each(pares)('%s atinge AA (4.5:1)', (_nome, fg, bg) => {
            const ratio = contrast(resolveToken(fg, scope), resolveToken(bg, scope));

            expect(ratio).toBeGreaterThanOrEqual(4.5);
        });
    });

    it('o --primary do escuro é de fato diferente do claro', () => {
        // Se a colisão voltar, os dois viram o mesmo hex e este teste cai —
        // é o sintoma observável do bug, medido no valor e não no arquivo.
        expect(resolveToken('--primary', darkVars)).not.toBe(resolveToken('--primary', new Map()));
    });
});

describe('o trio de tokens de estado', () => {
    /**
     * Um token achatado por status faz dois trabalhos incompatíveis: como
     * preenchimento precisa contrastar com o rótulo em cima; como texto sobre
     * o canvas precisa contrastar com o canvas — e no tema escuro os dois
     * puxam para lados opostos. O trio `--state-X-{bg,fg,border}` dá ao texto
     * e ao callout suave tokens próprios, e cada `fg` é medido nos DOIS
     * lugares em que aparece: sobre o próprio `bg` e sobre canvas, card e
     * popover.
     *
     * A forma vem do ctfinance; os valores não. Os percentuais de lá reprovam
     * 3 de 4 nesta paleta, então os `fg` são literais calculados aqui e os
     * `bg` saem de `color-mix(in oklab)` sobre o card, que o teste sabe
     * avaliar.
     */
    const AA = 4.5;

    describe.each(temas)('tema %s', (_tema, scope) => {
        it.each(estados)('texto de %s é legível sobre o próprio fundo suave', (estado) => {
            const ratio = contrast(resolveToken(`--state-${estado}-fg`, scope), resolveToken(`--state-${estado}-bg`, scope));

            expect(ratio).toBeGreaterThanOrEqual(AA);
        });

        it.each(estados)('texto de %s é legível sobre canvas, card e popover', (estado) => {
            for (const superficie of ['--background', '--card', '--popover']) {
                const ratio = contrast(resolveToken(`--state-${estado}-fg`, scope), resolveToken(superficie, scope));

                expect(ratio, `--state-${estado}-fg sobre ${superficie}`).toBeGreaterThanOrEqual(AA);
            }
        });

        it.each(estados)('fundo suave de %s deriva do sólido por color-mix em oklab', (estado) => {
            // A técnica é a do ctvitrine, e é a do Tailwind 4 instalado (159
            // `color-mix(in oklab` no CSS compilado). Derivar do sólido
            // mantém o callout na mesma matiz que o botão do mesmo estado.
            const bg = scope.get(`--state-${estado}-bg`) ?? rootVars.get(`--state-${estado}-bg`);

            // O card vem PRIMEIRO: o polyfill de color-mix que o Tailwind aplica
            // cai na primeira cor em browser sem color-mix, e a superfície é o
            // fallback legível; o sólido na frente daria texto escuro sobre
            // fundo escuro exatamente onde não há como medir.
            expect(bg).toMatch(new RegExp(`^color-mix\\(in oklab, var\\(--card\\) \\d+%, var\\(--${estado}\\)\\)$`));
        });

        it.each(estados)('texto de %s é literal calculado, não mistura', (estado) => {
            // O fg é o número que vira contrato; sair de mistura o tornaria
            // um efeito colateral do sólido em vez de uma escolha medida.
            const fg = scope.get(`--state-${estado}-fg`) ?? rootVars.get(`--state-${estado}-fg`);

            expect(fg).toMatch(/^#[0-9a-f]{6}$/);
        });
    });

    it('declara o trio inteiro nos dois temas, sem órfão de um lado', () => {
        const claro = [...rootVars.keys()].filter((k) => k.startsWith('--state-')).sort();
        const escuro = [...darkVars.keys()].filter((k) => k.startsWith('--state-')).sort();

        expect(claro).toHaveLength(estados.length * 3);
        expect(escuro).toEqual(claro);
    });

    it.each(estados)('expõe o trio de %s como utilitário pelo papel, via @utility', (estado) => {
        // `@utility` (e não `@layer components`) para aceitar variante como
        // qualquer utilitário. `state-X-soft` aplica os três de uma vez.
        expect(css).toMatch(
            new RegExp(
                `@utility state-${estado}-soft \\{\\s*border-color: var\\(--state-${estado}-border\\);\\s*background-color: var\\(--state-${estado}-bg\\);\\s*color: var\\(--state-${estado}-fg\\);\\s*\\}`,
            ),
        );
        expect(css).toMatch(new RegExp(`@utility bg-state-${estado} \\{\\s*background-color: var\\(--state-${estado}-bg\\);\\s*\\}`));
        expect(css).toMatch(new RegExp(`@utility text-state-${estado} \\{\\s*color: var\\(--state-${estado}-fg\\);\\s*\\}`));
        expect(css).toMatch(new RegExp(`@utility border-state-${estado} \\{\\s*border-color: var\\(--state-${estado}-border\\);\\s*\\}`));
    });
});

describe('contraste dos objetos gráficos de estado', () => {
    /**
     * O terceiro par: **objeto gráfico × superfície**.
     *
     * WCAG 2.2 SC 1.4.11 pede 3:1 para o que comunica significado sem ser
     * texto. O toast usa os tokens de estado em duas marcas gráficas, e as
     * duas são o único sinal de severidade que quem não lê o texto recebe:
     *
     * - a borda esquerda de 4px (`lib/toast-config.ts` + `.toast-*` em
     *   `app.css`), que fica sobre `--card`;
     * - o disco do ícone, que só aparece nos tipos `success` e `error` — em
     *   `warning`/`info` a lib não desenha indicador nenhum (tipo `blank`), e
     *   por isso eles NÃO entram na tabela do glifo abaixo.
     *
     * Este bloco não é herança do ctvitrine: de lá veio o argumento (6 contas
     * de contraste certas em comentário, e nenhum teste). O artefato é o
     * daqui, estendido.
     */
    const MINIMO_NAO_TEXTUAL = 3;

    /** Marca de severidade sobre a superfície do card. */
    const marcas: Array<[string, string]> = [
        ['--success', '--card'],
        ['--destructive', '--card'],
        ['--warning', '--card'],
        ['--info', '--card'],
    ];

    /** Glifo desenhado DENTRO do disco — só onde existe disco. */
    const glifos: Array<[string, string]> = [
        ['--success-foreground', '--success'],
        ['--destructive-foreground', '--destructive'],
    ];

    /** Arco do spinner de `toast.promise` sobre o card. */
    const spinner: Array<[string, string]> = [['--muted-foreground', '--card']];

    /**
     * Pares que REPROVAM, medidos, com o PISO da medição (2.1476… → 2.14),
     * nunca o arredondado. Ficou VAZIA quando o trio de estado chegou: as
     * três dívidas que moravam aqui (`--warning` 2.14 e `--info` 2.77 sobre o
     * card no claro, `--success-foreground` 2.27 no disco no escuro) foram
     * pagas recalibrando o sólido. Entrada nova precisa de motivo e de data
     * no comentário ao lado — é catraca, não licença.
     */
    const DIVIDA: Record<string, number> = {};

    describe.each(temas)('tema %s', (tema, scope) => {
        it.each([...marcas, ...glifos, ...spinner])('%s destaca contra %s (3:1)', (mark, surface) => {
            const ratio = contrast(resolveToken(mark, scope), resolveToken(surface, scope));
            const divida = DIVIDA[`${tema} ${mark} x ${surface}`];

            if (divida === undefined) {
                expect(ratio).toBeGreaterThanOrEqual(MINIMO_NAO_TEXTUAL);

                return;
            }

            expect(ratio).toBeGreaterThanOrEqual(divida);
            expect(ratio, `se passou de 3:1, tire "${tema} ${mark} x ${surface}" da tabela de dívida`).toBeLessThan(MINIMO_NAO_TEXTUAL);
        });
    });

    it('não deixa a tabela de dívida sobreviver aos pares que ela justifica', () => {
        // Dívida que não corresponde a nenhum par medido é dívida esquecida:
        // ela passa a autorizar um contraste que ninguém mais verifica.
        const medidos = new Set(
            temas.flatMap(([tema]) => [...marcas, ...glifos, ...spinner].map(([mark, surface]) => `${tema} ${mark} x ${surface}`)),
        );

        expect(Object.keys(DIVIDA).filter((chave) => !medidos.has(chave))).toEqual([]);
    });
});

describe('contraste do anel de foco', () => {
    /**
     * Todos os primitivos desligam o anel nativo do browser (`outline-none`) e
     * desenham o próprio com `focus-visible:ring-ring`. Quem faz isso assume a
     * WCAG 2.2 SC 1.4.11: o indicador é componente de interface e precisa de
     * 3:1 contra as cores adjacentes — o canvas em volta e a borda do campo
     * que ele contorna.
     *
     * `--ring` valia `--brand-cyan-light` nos DOIS temas. No escuro isso dá
     * 7.93:1 e passa; no claro dá **1.85:1** contra o branco e 1.49:1 contra
     * `--input`. Ou seja: o tema escuro estava certo por acidente e o claro
     * não tinha indicador de foco visível.
     */
    const MINIMO_NAO_TEXTUAL = 3;

    // Cada anel × as duas superfícies que encostam nele.
    const pares: Array<[string, string]> = [
        ['--ring', '--background'],
        ['--ring', '--input'],
        ['--sidebar-ring', '--sidebar'],
        ['--sidebar-ring', '--sidebar-border'],
    ];

    describe.each(temas)('tema %s', (_tema, scope) => {
        it.each(pares)('%s destaca contra %s (3:1)', (ring, surface) => {
            const ratio = contrast(resolveToken(ring, scope), resolveToken(surface, scope));

            expect(ratio).toBeGreaterThanOrEqual(MINIMO_NAO_TEXTUAL);
        });
    });
});

describe('a mistura que o teste avalia é a que o browser pinta', () => {
    it('reproduz color-mix(in oklab) num caso conhecido', () => {
        // 50% preto + 50% branco em OKLab é o cinza de L = 0.5, que em sRGB é
        // ~#636363 (o meio perceptual, não o aritmético #808080). Se a
        // conversão regredir, toda razão dos fundos suaves fica errada junto.
        expect(mixOklab('#000000', 50, '#ffffff')).toBe('#636363');
        expect(mixOklab('#15803d', 100, '#ffffff')).toBe('#15803d');
        expect(mixOklab('#15803d', 0, '#ffffff')).toBe('#ffffff');
    });
});
