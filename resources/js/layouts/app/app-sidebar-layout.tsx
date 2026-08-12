import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ImpersonateBanner } from '@/components/impersonate-banner';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { auth } = usePage().props as {
        auth?: { impersonating?: { active?: boolean; originalUserName?: string | null; impersonatedUserName?: string | null } };
    };

    return (
        <AppShell variant="sidebar">
            {/*
             * Primeiro focável da página, escondido até receber foco. O alvo é o
             * `<main>` do `SidebarInset`, três componentes abaixo: `AppContent`
             * repassa `{...props}` e o primitivo espalha no `<main>`, então o
             * `id` chega lá sem tocar em `ui/sidebar.tsx`. O `tabIndex={-1}`
             * existe porque `<main>` não é focável por padrão — sem ele o
             * browser move o scroll mas deixa o foco no link.
             */}
            <a
                href="#conteudo"
                className="focus:bg-background focus:text-foreground focus:ring-ring sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus-visible:ring-2"
            >
                Pular para o conteúdo
            </a>
            <AppSidebar />
            <AppContent variant="sidebar" id="conteudo" tabIndex={-1}>
                <ImpersonateBanner
                    active={auth?.impersonating?.active || false}
                    originalUserName={auth?.impersonating?.originalUserName || null}
                    impersonatedUserName={auth?.impersonating?.impersonatedUserName || null}
                />
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
