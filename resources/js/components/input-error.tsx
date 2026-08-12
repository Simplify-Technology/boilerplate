import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

/**
 * Mensagem de erro de um campo.
 *
 * `role="alert"` não é decoração: o nó só existe DEPOIS da falha, e
 * `aria-live` num nó recém-montado não anuncia nada — a região precisa
 * preexistir à mudança. Para conteúdo inserido dinamicamente, `role="alert"` é
 * o mecanismo. Sem ele, o campo ganhava `aria-invalid` e o motivo nunca era
 * falado, em 28 usos.
 *
 * Mensagem em branco não renderiza: um `role="alert"` vazio anuncia o silêncio
 * e deixa o campo apontando `aria-describedby` para lugar nenhum.
 */
export default function InputError({ message, className = '', ...props }: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message?.trim() ? (
        <p {...props} role="alert" data-slot="input-error" className={cn('text-sm text-red-600 dark:text-red-400', className)}>
            {message}
        </p>
    ) : null;
}
