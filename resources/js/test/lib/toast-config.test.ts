import {
    toastErrorOptions,
    toastInfoOptions,
    toastLoadingOptions,
    toastPromiseOptions,
    toastSuccessOptions,
    toastWarningOptions,
} from '@/lib/toast-config';
import { describe, expect, it } from 'vitest';

/*
 * `react-hot-toast@2.6.0` aplica `ariaProps: { role: 'status', 'aria-live':
 * 'polite' }` a TODO toast — está escrito no `dist/index.js` da lib, não é
 * inferência. `polite` entra na fila: o leitor termina o que está lendo antes
 * de anunciar. Para "Usuário excluído" isso é o comportamento certo; para
 * "Falha ao salvar" é o errado, porque a pessoa segue interagindo com uma tela
 * cujo estado ela acredita ter mudado.
 *
 * Erro e aviso passam a `role="alert"` + `aria-live="assertive"`, que
 * interrompe. Sucesso e info FICAM `polite` de propósito — assertive em tudo
 * treina a pessoa a ignorar o canal inteiro.
 *
 * Não mexer em `duration` junto: `ui/toast-provider.tsx` não tem botão de
 * dispensa, então qualquer aumento (e principalmente `Infinity`) produz toast
 * preso na tela sem saída.
 */
describe('ariaProps dos toasts', () => {
    it('interrupts the screen reader for errors', () => {
        expect(toastErrorOptions.ariaProps).toEqual({ role: 'alert', 'aria-live': 'assertive' });
    });

    it('interrupts the screen reader for warnings', () => {
        expect(toastWarningOptions.ariaProps).toEqual({ role: 'alert', 'aria-live': 'assertive' });
    });

    it('leaves success on the polite queue, where it belongs', () => {
        expect(toastSuccessOptions.ariaProps).toBeUndefined();
    });

    it('leaves info on the polite queue, where it belongs', () => {
        expect(toastInfoOptions.ariaProps).toBeUndefined();
    });
});

/*
 * A cor do ícone é `iconTheme` — mas só onde existe ícone da lib para colorir.
 *
 * `app.css` teve por meses 4 blocos `.toast-{variante} [class*='toast-icon'],
 * [data-icon]` tentando o mesmo por CSS. Nenhum casava: o único atributo de
 * dado que a lib emite no DOM é `data-rht-toaster`, e classe com `toast-icon`
 * não existe em lugar nenhum do projeto. Foram apagados; estas asserções
 * existem para que a próxima pessoa que quiser trocar a cor do ícone encontre
 * o canal certo em vez de reescrever o CSS morto.
 *
 * A tabela anterior tinha 4 linhas e DUAS eram falsas: `warning` e `info`
 * declaravam `iconTheme` e ele nunca era lido — o teste travava campo morto e
 * dava a ele aparência de contrato. Ver o comentário longo em
 * `lib/toast-config.ts`; em resumo, `icon` definido sai do `ToastIcon` antes,
 * e `toast(...)` é tipo `blank`, que não desenha indicador nenhum.
 */
describe('iconTheme dos toasts', () => {
    it.each([
        ['success', toastSuccessOptions, 'var(--success)'],
        ['error', toastErrorOptions, 'var(--destructive)'],
    ])('colors the %s icon through iconTheme, not through CSS', (_nome, options, cor) => {
        expect(options.iconTheme?.primary).toBe(cor);
    });

    it.each([
        ['warning', toastWarningOptions],
        ['info', toastInfoOptions],
    ])('does not fake an iconTheme for %s, which never renders one', (_nome, options) => {
        expect(options.iconTheme).toBeUndefined();
    });

    it.each([
        ['warning', toastWarningOptions],
        ['info', toastInfoOptions],
    ])('keeps the emoji that is the only icon %s actually gets', (_nome, options) => {
        // Se o emoji sair, o toast fica sem ícone — e não é o `iconTheme` que
        // assume, porque `toast(...)` é `blank`. É a outra metade da razão de
        // o campo estar ausente acima.
        expect(options.icon).toBeTypeOf('string');
    });

    it('colors the promise spinner, whose default arc fails 1.4.11 on the dark card', () => {
        // `#616161` sobre `--card` do escuro dá 2.36:1. O arco é o indicador,
        // e indicador é objeto gráfico: 3:1.
        expect(toastLoadingOptions.iconTheme).toEqual({
            primary: 'var(--muted-foreground)',
            secondary: 'var(--border)',
        });
    });
});

/*
 * `toast.promise` é o furo pelo qual a severidade escapava.
 *
 * `createToast` grava `ariaProps: { role: 'status', 'aria-live': 'polite' }` no
 * próprio objeto do toast, e o merge do `<Toaster>` é
 * `{ ...defaults, ...defaults[type], ...toast }` — o toast é o último spread.
 * Logo o provider NÃO alcança `ariaProps`, e uma chamada sem terceiro
 * argumento entrega erro `polite`, cor default da lib e nenhuma borda de
 * variante.
 */
describe('toastPromiseOptions', () => {
    it('carries the assertive announcement into the promise error', () => {
        expect(toastPromiseOptions.error?.ariaProps).toEqual({ role: 'alert', 'aria-live': 'assertive' });
    });

    it('leaves the promise success on the polite queue, like every other success', () => {
        expect(toastPromiseOptions.success?.ariaProps).toBeUndefined();
    });

    it('reuses the same options the direct calls use, instead of a second source of truth', () => {
        expect(toastPromiseOptions.success).toBe(toastSuccessOptions);
        expect(toastPromiseOptions.error).toBe(toastErrorOptions);
        expect(toastPromiseOptions.loading).toBe(toastLoadingOptions);
    });

    it.each([
        ['loading', toastPromiseOptions.loading],
        ['success', toastPromiseOptions.success],
        ['error', toastPromiseOptions.error],
    ])('leaves the %s duration to the provider default', (_nome, options) => {
        // `ui/toast-provider.tsx` não tem botão de dispensa. O `Infinity` que a
        // lib usa por default em `loading` deixaria o toast preso na tela se a
        // visita do Inertia fosse cancelada — nem `onSuccess` nem `onError`
        // rodam nesse caso, então a promise nunca resolve.
        expect(options?.duration).toBeUndefined();
    });
});
