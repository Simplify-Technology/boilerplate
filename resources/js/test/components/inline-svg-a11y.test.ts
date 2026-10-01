// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readSources, type Source } from '../support/sources';

/*
 * `<svg>` escrito à mão não recebe o `aria-hidden` que o lucide-react injeta
 * sozinho em ícone sem prop de a11y. Sem atributo nenhum, o leitor de tela
 * anuncia um gráfico sem nome — era o caso do logo da sidebar e do padrão
 * hachurado dos painéis do dashboard.
 *
 * O contrato: todo `<svg` inline de resources/js é decorativo (`aria-hidden`,
 * quando o nome está ao lado — como o texto da marca junto do logo) OU é
 * imagem com nome (`role="img"` + `aria-label`/`aria-labelledby`/`<title>`).
 * Lucide fica de fora de propósito: o pacote já cuida disso.
 */

type Offense = { path: string; line: number; excerpt: string };

const OPENING = /<svg(?=[\s>])([^>]*)>/g;

function hasName(attrs: string, body: string): boolean {
    return /\baria-label(ledby)?\s*=/.test(attrs) || /<title[\s>]/.test(body);
}

/**
 * Prosa não é markup: um `<svg>` citado em comentário não pode virar infrator
 * nem álibi. Só comentários de linha inteira são apagados — um `//` no meio
 * da linha pode ser o de `xmlns="http://www.w3.org/2000/svg"`. As quebras de
 * linha ficam, para o número da linha continuar certo.
 */
function withoutComments(body: string): string {
    return body
        .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
        .replace(/^[ \t]*\/\/.*$/gm, (comment) => ' '.repeat(comment.length));
}

/** Cada `<svg>` do arquivo que nem é decorativo nem tem nome. */
function unlabelledInlineSvgs({ path, body }: Source): Offense[] {
    const offenses: Offense[] = [];
    const code = withoutComments(body);
    let match: RegExpExecArray | null;

    while ((match = OPENING.exec(code)) !== null) {
        const attrs = match[1];
        const close = code.indexOf('</svg>', match.index);
        const inner = code.slice(match.index, close === -1 ? undefined : close);
        const decorative = /\baria-hidden\s*=/.test(attrs);
        const named = /\brole\s*=\s*["']img["']/.test(attrs) && hasName(attrs, inner);

        if (!decorative && !named) {
            const lineEnd = code.indexOf('\n', match.index);

            offenses.push({
                path,
                line: code.slice(0, match.index).split('\n').length,
                excerpt: code.slice(match.index, lineEnd === -1 ? undefined : lineEnd).trim(),
            });
        }
    }

    return offenses;
}

const sources = readSources();

it('actually reads the frontend source tree and sees inline svgs', () => {
    expect(sources.length).toBeGreaterThan(50);
    // Some day the kit may have no hand-written svg left; then this control goes with the test.
    expect(sources.filter(({ body }) => /<svg[\s>]/.test(body)).length).toBeGreaterThanOrEqual(1);
});

describe('inline svg accessibility', () => {
    it('keeps every hand-written <svg> either decorative or named', () => {
        const offenses = sources.flatMap(unlabelledInlineSvgs);
        const report = offenses.map(({ path, line, excerpt }) => `${path}:${line}  ${excerpt}`).join('\n');

        expect(offenses, `<svg> sem aria-hidden e sem role="img" + nome:\n${report}`).toEqual([]);
    });
});

describe('the scanner itself', () => {
    const scan = (body: string) => unlabelledInlineSvgs({ path: 'fixture.tsx', body });

    it('flags an svg with no a11y attribute, with the line', () => {
        const body = ['<div>', '    <svg className={className} fill="none">', '        <path d="M0 0" />', '    </svg>', '</div>'].join('\n');

        expect(scan(body)).toEqual([{ path: 'fixture.tsx', line: 2, excerpt: '<svg className={className} fill="none">' }]);
    });

    it('accepts aria-hidden anywhere in the opening tag, including before a props spread', () => {
        expect(scan('<svg aria-hidden="true" {...props} viewBox="0 0 40 42">\n<path />\n</svg>')).toEqual([]);
        expect(scan('<svg className={cn(className)} fill="none" aria-hidden="true">\n</svg>')).toEqual([]);
    });

    it('accepts role="img" only when a name comes with it — aria-label, aria-labelledby or a <title>', () => {
        expect(scan('<svg role="img" aria-label="Logo da Simplify"><path /></svg>')).toEqual([]);
        expect(scan('<svg role="img" aria-labelledby="t"><title id="t">Logo</title></svg>')).toEqual([]);
        expect(scan('<svg role="img">\n    <title>Gráfico de vendas</title>\n</svg>')).toEqual([]);
        expect(scan('<svg role="img" viewBox="0 0 24 24"><path /></svg>')).toHaveLength(1);
    });

    it('does not mistake an svg mentioned in prose or a lucide component for an inline svg', () => {
        expect(scan('// o lucide renderiza um <svg> por conta própria\n<Sun className="size-4" />')).toEqual([]);
        expect(scan('<SvgIcon name="x" />')).toEqual([]);
    });
});
