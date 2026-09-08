import { SidebarProvider } from '@/components/ui/sidebar';
import React, { useState } from 'react';

/*
 * O shell tem UM caminho, o da sidebar. Existia um ramo `header` sem chamador
 * — e ele era o DEFAULT: `<AppShell>` sem prop montava a árvore sem
 * `SidebarProvider`, e todo primitivo de `ui/sidebar` lá dentro estourava
 * ("useSidebar must be used within a SidebarProvider"). Sem a prop, não há
 * default apontando para o ramo que ninguém exercita.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sidebar') !== 'false' : true));

    const handleSidebarChange = (open: boolean) => {
        setIsOpen(open);

        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar', String(open));
        }
    };

    return (
        <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={handleSidebarChange}>
            {children}
        </SidebarProvider>
    );
}
