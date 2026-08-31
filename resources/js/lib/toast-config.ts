import { DefaultToastOptions, ToastOptions } from 'react-hot-toast';

/**
 * Configurações padrão para todos os toasts
 */
export const toastDefaultOptions: ToastOptions = {
    position: 'top-right',
    duration: 4000,
    style: {
        background: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.875rem 1rem',
        fontSize: '0.875rem',
        fontFamily: 'var(--font-sans)',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        maxWidth: '420px',
        lineHeight: '1.5',
    },
    className: 'toast-custom',
};

/**
 * Configurações específicas para toasts de sucesso
 */
export const toastSuccessOptions: ToastOptions = {
    className: 'toast-success',
    style: {
        background: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--success)',
        borderRadius: 'var(--radius)',
    },
    iconTheme: {
        primary: 'var(--success)',
        secondary: 'var(--success-foreground)',
    },
};

/**
 * Configurações específicas para toasts de erro
 *
 * `ariaProps` sobrescreve o default da lib (`role: 'status'`,
 * `aria-live: 'polite'`, em `react-hot-toast@2.6.0`), que enfileira o anúncio
 * atrás do que estiver sendo lido. Falha de operação interrompe; sucesso e
 * info continuam `polite` de propósito — assertive em tudo treina a pessoa a
 * ignorar o canal inteiro.
 */
export const toastErrorOptions: ToastOptions = {
    className: 'toast-error',
    ariaProps: { role: 'alert', 'aria-live': 'assertive' },
    style: {
        background: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--destructive)',
        borderRadius: 'var(--radius)',
    },
    iconTheme: {
        primary: 'var(--destructive)',
        secondary: 'var(--destructive-foreground)',
    },
};

/*
 * Aviso e info NÃO declaram `iconTheme`, e não é esquecimento — o campo é
 * inalcançável para os dois, por duas razões independentes. As duas estão no
 * `ToastIcon` do `dist/` de `react-hot-toast@2.6.0`:
 *
 *   ({ icon, type, iconTheme }) =>
 *     icon !== undefined ? <>{icon}</>          // ramo 1: sai antes
 *     : type === 'blank' ? null                 // ramo 2: não há o que colorir
 *     : <Indicator {...iconTheme} />
 *
 * 1. Os dois declaram `icon` (o emoji), e o ramo 1 retorna sem tocar no
 *    `iconTheme`.
 * 2. Os dois são emitidos por `toast(...)` em `lib/flash.ts`, que é o tipo
 *    `blank` — o ramo 2 devolve `null`, então não existe indicador nenhum.
 *
 * Ou seja: apagar o emoji não ressuscitaria o `iconTheme`; deixaria o toast
 * sem ícone algum. O canal de cor de aviso e info é a borda esquerda do
 * `style`, e é por ela que `--warning` e `--info` continuam vivos aqui.
 * `test/lib/toast-config.test.ts` trava a ausência nos dois sentidos.
 */

/**
 * Configurações específicas para toasts de aviso
 *
 * Assertive pelo mesmo motivo do erro: aviso que chega depois de a pessoa já
 * ter seguido em frente não é aviso.
 */
export const toastWarningOptions: ToastOptions = {
    icon: '⚠️',
    className: 'toast-warning',
    ariaProps: { role: 'alert', 'aria-live': 'assertive' },
    style: {
        background: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--warning)',
        borderRadius: 'var(--radius)',
        padding: '0.875rem 1rem',
        fontSize: '0.875rem',
        fontFamily: 'var(--font-sans)',
    },
};

/**
 * Configurações específicas para toasts informativos
 */
export const toastInfoOptions: ToastOptions = {
    icon: 'ℹ️',
    className: 'toast-info',
    style: {
        background: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--info)',
        borderRadius: 'var(--radius)',
        padding: '0.875rem 1rem',
        fontSize: '0.875rem',
        fontFamily: 'var(--font-sans)',
    },
};

/**
 * Configurações do toast de carregamento — só existe dentro de `toast.promise`.
 *
 * Sem `className` de propósito: carregamento não é severidade, então ele fica
 * com o `toast-custom` do default em vez de ganhar uma classe sem regra de CSS
 * do outro lado.
 *
 * O `iconTheme` aqui é lido de verdade (tipo `loading`, sem `icon` próprio):
 * `primary` pinta o arco que gira e `secondary` a trilha. Os defaults da lib
 * são `#616161` e `#e0e0e0`, e o arco reprova 1.4.11 no escuro (2.36:1 sobre
 * `--card`); `--muted-foreground` passa nos dois temas.
 *
 * `duration` NÃO vai a `Infinity`, apesar de ser o default da lib para
 * `loading`: `ui/toast-provider.tsx` não tem botão de dispensa, e a promise
 * destes call sites só resolve dentro de `onSuccess`/`onError` do Inertia —
 * uma visita cancelada não chama nenhum dos dois e deixaria o toast preso na
 * tela para sempre. Fica o 4000ms de `toastDefaultOptions`.
 */
export const toastLoadingOptions: ToastOptions = {
    iconTheme: {
        primary: 'var(--muted-foreground)',
        secondary: 'var(--border)',
    },
};

/**
 * Terceiro argumento obrigatório de `toast.promise`.
 *
 * `toast.promise` NÃO herda nada do `toastOptions` do `<Toaster>` quando o
 * assunto é `ariaProps`: `createToast` grava `{ role: 'status', 'aria-live':
 * 'polite' }` no próprio toast, e o merge do provider é
 * `{ ...defaults, ...defaults[type], ...toast }` — o toast é o último spread e
 * vence. Sem este objeto, o toast de erro de toda ação assíncrona chega
 * `polite` e a decisão de severidade não sai do papel.
 *
 * A forma `{ loading, success, error }` é a que a lib documenta
 * (`opts?: DefaultToastOptions`): ela aplica o bloco do estado em que o toast
 * está no momento, reaproveitando o mesmo id.
 *
 * `test/lib/toast-promise-call-sites.test.ts` cobra o uso em todo call site.
 */
export const toastPromiseOptions: DefaultToastOptions = {
    loading: toastLoadingOptions,
    success: toastSuccessOptions,
    error: toastErrorOptions,
};
