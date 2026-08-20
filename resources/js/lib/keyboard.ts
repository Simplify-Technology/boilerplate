/*
 * Guardas para atalho de teclado GLOBAL.
 *
 * Handler registrado em `window` alcança também o que a pessoa está digitando
 * dentro de um campo, e o `preventDefault()` dele come a tecla nativa. O caso
 * concreto que originou este módulo: no macOS, Ctrl+B é o binding do sistema
 * para "mover o cursor um caractere à esquerda" dentro de `<input>` e
 * `<textarea>` — o atalho da sidebar (`Cmd/Ctrl+B`) trocava a edição de texto
 * por abrir/fechar o menu, sem aviso e sem escapatória.
 */

const TYPING_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

/**
 * O alvo do evento é um campo em que a pessoa digita?
 *
 * Use como early-return em todo handler global de `keydown` ANTES de chamar
 * `preventDefault()`. Cobre os campos nativos e qualquer nó `contenteditable`
 * (o boilerplate não tem editor rich-text hoje, mas o guard-rail não deve
 * nascer cego para o dia em que tiver).
 */
export function isTypingTarget(target: EventTarget | null): boolean {
    if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) {
        return false;
    }

    /*
     * `isContentEditable` é a checagem correta no browser — ela é HERDADA, então
     * vale para qualquer nó dentro do host editável, que é onde o caret costuma
     * pousar. Mas o jsdom não a implementa (fica sempre `false`), e um guard-rail
     * que nenhum teste consegue exercitar não é guard-rail: o `closest()` cobre a
     * mesma hierarquia pelo atributo e mantém o caso testável aqui.
     */
    if (target.isContentEditable || target.closest('[contenteditable]:not([contenteditable="false"])') !== null) {
        return true;
    }

    return TYPING_TAGS.includes(target.tagName);
}

/**
 * A plataforma usa ⌘ como modificador de atalho?
 *
 * Só para ESCREVER a dica na tela — a checagem do handler continua sendo
 * `metaKey || ctrlKey`, porque as duas teclas funcionam nas duas plataformas e
 * quem chega de outro sistema aperta a que já conhece. Lida sob demanda (nunca
 * no módulo) porque `navigator` não existe no SSR.
 */
export function isAppleKeyboard(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Rótulo humano do atalho, na convenção da plataforma: `⌘B` ou `Ctrl+B`. */
export function shortcutLabel(key: string, apple = isAppleKeyboard()): string {
    return apple ? `⌘${key.toUpperCase()}` : `Ctrl+${key.toUpperCase()}`;
}
