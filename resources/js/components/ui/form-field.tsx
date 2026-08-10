import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { FORM_CONTROL_LABEL_CLASSNAME } from '@/lib/form-styles';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';

type FieldControlProps = {
    id?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
};

export type FormFieldProps = {
    label: ReactNode;
    htmlFor?: string;
    hint?: ReactNode;
    error?: string;
    required?: boolean;
    /** Conteúdo alinhado à direita do label (ex.: link "Esqueceu a senha?"). */
    action?: ReactNode;
    labelIcon?: LucideIcon;
    className?: string;
    labelClassName?: string;
    children: ReactElement<FieldControlProps>;
};

/**
 * Campo de formulário com a fiação de acessibilidade feita uma vez só:
 * injeta `id`, `aria-describedby` (hint + erro) e `aria-invalid` no controle
 * filho e renderiza a mensagem de erro embaixo — nenhuma tela precisa montar
 * esses atributos à mão.
 */
export function FormField({
    label,
    htmlFor,
    hint,
    error,
    required = false,
    action,
    labelIcon: LabelIcon,
    className,
    labelClassName,
    children,
}: FormFieldProps) {
    const reactId = useId();
    const hintId = hint ? `${reactId}-hint` : undefined;
    const errorId = error ? `${reactId}-error` : undefined;

    const describedBy = [children.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;

    const control = isValidElement(children)
        ? cloneElement(children, {
              id: children.props.id ?? htmlFor,
              'aria-describedby': describedBy,
              'aria-invalid': children.props['aria-invalid'] ?? (error ? true : undefined),
          })
        : children;

    return (
        <div data-slot="form-field" data-testid="form-field-root" className={cn('flex flex-col gap-2', className)}>
            <div className="flex items-start justify-between gap-3">
                <Label htmlFor={htmlFor} className={cn(FORM_CONTROL_LABEL_CLASSNAME, labelClassName)}>
                    {LabelIcon ? <LabelIcon className="text-muted-foreground h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
                    <span className="min-w-0">{label}</span>
                    {required ? (
                        <span data-slot="form-field-required" className="text-destructive shrink-0" aria-hidden="true">
                            *
                        </span>
                    ) : null}
                </Label>

                {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
            </div>

            {hint ? (
                <p id={hintId} data-slot="form-field-hint" className="text-muted-foreground text-sm">
                    {hint}
                </p>
            ) : null}

            <div data-slot="form-field-control">{control}</div>

            <InputError id={errorId} message={error} />
        </div>
    );
}
