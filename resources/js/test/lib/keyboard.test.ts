import { isAppleKeyboard, isTypingTarget, shortcutLabel } from '@/lib/keyboard';
import { afterEach, describe, expect, it } from 'vitest';

const cleanup: Array<() => void> = [];

function mount<T extends HTMLElement>(el: T): T {
    document.body.appendChild(el);
    cleanup.push(() => el.remove());

    return el;
}

function withUserAgent(userAgent: string): void {
    const original = Object.getOwnPropertyDescriptor(window.navigator, 'userAgent');

    Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true });
    cleanup.push(() => {
        if (original) {
            Object.defineProperty(window.navigator, 'userAgent', original);
        }
    });
}

afterEach(() => {
    while (cleanup.length) {
        cleanup.pop()?.();
    }
});

describe('isTypingTarget', () => {
    it.each(['input', 'textarea', 'select'])('treats <%s> as a typing target', (tag) => {
        expect(isTypingTarget(mount(document.createElement(tag)))).toBe(true);
    });

    it('treats a contenteditable node as a typing target', () => {
        const div = mount(document.createElement('div'));
        div.setAttribute('contenteditable', 'true');

        expect(isTypingTarget(div)).toBe(true);
    });

    /*
     * Dentro de um host editável o caret pousa no nó mais interno, então o alvo
     * do `keydown` costuma ser um descendente — e não o host.
     */
    it('treats a node nested inside a contenteditable host as a typing target', () => {
        const host = mount(document.createElement('div'));
        host.setAttribute('contenteditable', 'true');
        const bold = host.appendChild(document.createElement('b'));

        expect(isTypingTarget(bold)).toBe(true);
    });

    it('does not treat contenteditable="false" as a typing target', () => {
        const div = mount(document.createElement('div'));
        div.setAttribute('contenteditable', 'false');

        expect(isTypingTarget(div)).toBe(false);
    });

    it('does not treat an ordinary element as a typing target', () => {
        expect(isTypingTarget(mount(document.createElement('button')))).toBe(false);
        expect(isTypingTarget(mount(document.createElement('div')))).toBe(false);
    });

    /*
     * `keydown` sem foco em elemento nenhum chega com `event.target === document`
     * (ou `window`), que não é `HTMLElement`: o atalho tem de continuar valendo.
     */
    it('does not treat document or window as a typing target', () => {
        expect(isTypingTarget(document)).toBe(false);
        expect(isTypingTarget(window)).toBe(false);
        expect(isTypingTarget(null)).toBe(false);
    });
});

describe('isAppleKeyboard', () => {
    it('recognises the Apple platforms', () => {
        withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
        expect(isAppleKeyboard()).toBe(true);
    });

    it('does not claim Apple on other platforms', () => {
        withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        expect(isAppleKeyboard()).toBe(false);
    });
});

describe('shortcutLabel', () => {
    it('writes the hint in the convention of each platform', () => {
        expect(shortcutLabel('b', true)).toBe('⌘B');
        expect(shortcutLabel('b', false)).toBe('Ctrl+B');
    });
});
