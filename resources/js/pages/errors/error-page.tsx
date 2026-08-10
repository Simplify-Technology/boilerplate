import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';

interface ErrorPageProps {
    status: number;
}

const content: Record<number, { title: string; message: string }> = {
    403: {
        title: 'Acesso negado',
        message: 'Você não tem permissão para acessar esta página.',
    },
    404: {
        title: 'Página não encontrada',
        message: 'A página que você procura não existe ou foi movida.',
    },
    500: {
        title: 'Erro interno',
        message: 'Algo deu errado do nosso lado. Tente novamente em instantes.',
    },
    503: {
        title: 'Em manutenção',
        message: 'Estamos fazendo uma manutenção rápida. Voltamos em breve.',
    },
};

export default function ErrorPage({ status }: ErrorPageProps) {
    const { title, message } = content[status] ?? content[500];

    return (
        <div className="bg-background text-foreground flex min-h-svh flex-col items-center justify-center gap-6 p-6">
            <Head title={title} />

            <p className="text-muted-foreground font-title text-7xl font-bold tracking-tight">{status}</p>

            <div className="max-w-md space-y-2 text-center">
                <h1 className="font-title text-2xl font-semibold">{title}</h1>
                <p className="text-muted-foreground text-sm">{message}</p>
            </div>

            {status !== 503 && (
                <Button asChild>
                    <Link href="/dashboard">Voltar para o início</Link>
                </Button>
            )}
        </div>
    );
}
