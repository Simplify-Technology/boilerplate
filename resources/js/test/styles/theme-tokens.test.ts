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
const rootVars = declarations(block(':root'));
const darkVars = declarations(block('.dark'));

/** Resolve cadeias de `var(--x)` até chegar num literal. */
function resolveToken(name: string, scope: Map<string, string>): string {
    const seen = new Set<string>();
    let value = scope.get(name) ?? rootVars.get(name);

    while (value !== undefined) {
        const match = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value);

        if (!match) return value;

        const next = match[1];

        if (seen.has(next)) throw new Error(`Ciclo de var() em ${name}`);

        seen.add(next);
        value = scope.get(next) ?? rootVars.get(next);
    }

    throw new Error(`Token ${name} não resolve para literal`);
}

function relativeLuminance(hex: string): number {
    const normalized = hex.trim().toLowerCase() === 'white' ? '#ffffff' : hex.trim();
    const raw = normalized.replace('#', '');
    const full = raw.length === 3 ? [...raw].map((c) => c + c).join('') : raw;

    const channels = [0, 2, 4].map((i) => {
        const channel = parseInt(full.slice(i, i + 2), 16) / 255;

        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
    const [x, y] = [relativeLuminance(a), relativeLuminance(b)];

    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

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
        const semLiteral = [...declarations(themeBody).entries()]
            .filter(([name]) => name.startsWith('--color-'))
            .filter(([, value]) => !value.startsWith('var('));

        expect(semLiteral).toEqual([]);
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
    ];

    describe.each([
        ['claro', new Map<string, string>()],
        ['escuro', darkVars],
    ])('tema %s', (_tema, scope) => {
        it.each(pares)('%s atinge AA (4.5:1)', (_nome, fg, bg) => {
            const ratio = contrast(resolveToken(fg, scope), resolveToken(bg, scope));

            expect(ratio).toBeGreaterThanOrEqual(4.5);
        });
    });

    /**
     * `destructive` no escuro está em 3.67:1 e NÃO passa. É dívida conhecida,
     * anterior a esta fatia, e não dá para pagar aqui: o mesmo token serve de
     * preenchimento (precisa ser escuro o bastante para texto branco) e de cor
     * de texto sobre o canvas escuro (precisa ser claro o bastante). Medido:
     * escurecer para #e11d48 leva o botão a 4.70 mas derruba `text-destructive`
     * de 3.99 para 3.12 — e é justamente `text-destructive` que a fatia E6 vai
     * passar a usar no `InputError`.
     *
     * A cura é separar preenchimento de texto (candidato F3, tokens
     * `--state-*`). Até lá isto fica como CATRACA: não conserta, mas impede
     * piorar, e a fatia F3 sobe o piso ao passar por aqui.
     */
    const DIVIDA_DESTRUCTIVE_ESCURO = 3.67;

    it('destructive no escuro não piora enquanto o F3 não separa fill de texto', () => {
        const ratio = contrast(resolveToken('--destructive-foreground', darkVars), resolveToken('--destructive', darkVars));

        expect(ratio).toBeGreaterThanOrEqual(DIVIDA_DESTRUCTIVE_ESCURO);
        expect(ratio, 'se passou de 4.5, o F3 chegou — mova o par para a tabela de cima').toBeLessThan(4.5);
    });

    it('destructive no tema claro passa', () => {
        const ratio = contrast(resolveToken('--destructive-foreground', new Map()), resolveToken('--destructive', new Map()));

        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('o --primary do escuro é de fato diferente do claro', () => {
        // Se a colisão voltar, os dois viram o mesmo hex e este teste cai —
        // é o sintoma observável do bug, medido no valor e não no arquivo.
        expect(resolveToken('--primary', darkVars)).not.toBe(resolveToken('--primary', new Map()));
    });
});
