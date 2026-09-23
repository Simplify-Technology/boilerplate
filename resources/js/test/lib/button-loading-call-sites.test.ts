// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readSources, type Source } from '../support/sources';

/*
 * A trava do follow-up do E28.
 *
 * `ui/button.tsx` ganhou `loading` na #106 e `.ai/rules/js.md` diz que botão
 * em envio usa essa prop. A regra não impedia ninguém de montar o indicador na
 * mão dentro do `<Button>`: foi assim que 15 call sites ficaram para trás por
 * seis fatias, em três idiomas — o `LoaderCircle` solto das telas de auth, o
 * `div` artesanal com `border-t-transparent` e o primitivo — e nenhum dos 15
 * anunciava `aria-busy`.
 *
 * O contrato: nenhum `<Button>` tem indicador de envio como filho. Spinner
 * fora de botão (o da busca, o de tela) segue livre — a trava mira o filho de
 * `<Button>`, não `animate-spin` em geral. Botão que precise sinalizar envio
 * passa `loading` (e `loadingText` se o rótulo muda) e herda o `aria-busy`.
 */

/** Qualquer um dos três idiomas que a migração apagou. */
const INDICATOR = /animate-spin|LoaderCircle|border-t-transparent/;

type Offense = { path: string; line: number; excerpt: string };

/**
 * Fim da tag de abertura que começa em `start` (índice do `<`). Chaves e aspas
 * são respeitadas: um `>` dentro de `onClick={() => a > b}` não fecha a tag.
 */
function openingTagEnd(body: string, start: number): { end: number; selfClosing: boolean } | null {
    let depth = 0;
    let quote: string | null = null;

    for (let i = start + 1; i < body.length; i++) {
        const ch = body[i];

        if (quote) {
            if (ch === quote) quote = null;
            continue;
        }

        if (ch === '"' || ch === "'" || ch === '`') {
            quote = ch;
        } else if (ch === '{') {
            depth++;
        } else if (ch === '}') {
            depth--;
        } else if (depth === 0 && ch === '/' && body[i + 1] === '>') {
            return { end: i + 2, selfClosing: true };
        } else if (depth === 0 && ch === '>') {
            return { end: i + 1, selfClosing: false };
        }
    }

    return null;
}

/** Filhos de cada `<Button>` do arquivo que montam indicador de envio próprio. */
function loadingIndicatorsInsideButtons({ path, body }: Source): Offense[] {
    const offenses: Offense[] = [];
    const opening = /<Button(?=[\s>/])/g;
    let match: RegExpExecArray | null;

    while ((match = opening.exec(body)) !== null) {
        const tag = openingTagEnd(body, match.index);

        if (!tag) break;
        if (tag.selfClosing) continue;

        const close = body.indexOf('</Button>', tag.end);

        if (close === -1) break;

        const hit = INDICATOR.exec(body.slice(tag.end, close));

        if (hit) {
            const at = tag.end + hit.index;
            const lineStart = body.lastIndexOf('\n', at) + 1;
            const lineEnd = body.indexOf('\n', at);

            offenses.push({
                path,
                line: body.slice(0, at).split('\n').length,
                excerpt: body.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim(),
            });
        }

        opening.lastIndex = close;
    }

    return offenses;
}

const sources = readSources();

it('actually reads the frontend source tree', () => {
    expect(sources.length).toBeGreaterThan(50);
    expect(sources.filter(({ body }) => body.includes('<Button')).length).toBeGreaterThan(10);
});

describe('loading indicator ownership', () => {
    it('keeps every <Button> free of a hand-rolled loading indicator', () => {
        const offenses = sources.flatMap(loadingIndicatorsInsideButtons);
        const report = offenses.map(({ path, line, excerpt }) => `${path}:${line}  ${excerpt}`).join('\n');

        expect(offenses, `Indicador de envio montado à mão dentro de <Button> — use loading/loadingText:\n${report}`).toEqual([]);
    });
});

describe('the scanner itself', () => {
    const scan = (body: string) => loadingIndicatorsInsideButtons({ path: 'fixture.tsx', body });

    it('flags a spinner div and a LoaderCircle as children of <Button>, with the line', () => {
        const body = [
            '<Button type="submit" disabled={processing}>',
            '    {processing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" /> : null}',
            '    Salvar',
            '</Button>',
            '<Button>',
            '    {processing && <LoaderCircle />}',
            '    Entrar',
            '</Button>',
        ].join('\n');

        expect(scan(body)).toEqual([
            { path: 'fixture.tsx', line: 2, excerpt: expect.stringContaining('animate-spin') },
            { path: 'fixture.tsx', line: 6, excerpt: '{processing && <LoaderCircle />}' },
        ]);
    });

    it('ignores a spinner outside any <Button>, and a self-closing <Button /> does not swallow what follows', () => {
        const body = [
            '<Button onClick={() => count > 1 && save()} loading={processing} />',
            '<div className="animate-spin" aria-hidden="true" />',
            '<Button loading={processing} loadingText="Salvando…">',
            '    <Save className="h-4 w-4" />',
            '    Salvar',
            '</Button>',
        ].join('\n');

        expect(scan(body)).toEqual([]);
    });

    it('never reads the opening tag as children: a > inside braces or a class on the tag itself is not an offense', () => {
        const body = [
            '<Button onClick={() => a > b} className="rotate animate-spin" title={"x > y"}>',
            '    Girar',
            '</Button>',
            '<ButtonGroup><LoaderCircle /></ButtonGroup>',
        ].join('\n');

        expect(scan(body)).toEqual([]);
    });
});
