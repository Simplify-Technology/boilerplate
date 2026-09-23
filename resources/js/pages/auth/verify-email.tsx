// Components
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthLayout title="Verificar Email" description="Verifique seu endereço de e-mail clicando no link que acabamos de enviar para você.">
            <Head title="Verificar Email" />

            {status === 'verification-link-sent' && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-50">
                    <AlertDescription className="text-emerald-900/90 dark:text-emerald-50/90">
                        Um novo link de verificação foi enviado para o endereço de e-mail que você forneceu durante o registro.
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={submit} className="space-y-6 text-center">
                <Button loading={processing} variant="secondary" className="w-full">
                    Enviar link de verificação novamente
                </Button>

                <TextLink href={route('logout')} method="post" className="mx-auto block text-sm">
                    Sair
                </TextLink>
            </form>
        </AuthLayout>
    );
}
