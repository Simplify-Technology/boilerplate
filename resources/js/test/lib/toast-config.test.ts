import { toastErrorOptions, toastInfoOptions, toastSuccessOptions, toastWarningOptions } from '@/lib/toast-config';
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
