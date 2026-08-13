import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, Shield, Users } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Usuários',
        url: '/users',
        icon: Users,
        permission: 'manage_users',
    },
    {
        title: 'Permissões',
        url: '/permissions/roles',
        icon: Shield,
        permission: 'manage_roles',
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('dashboard')} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/*
             * O landmark entra por prop do call-site: `ui/sidebar.tsx` é código
             * shadcn e tem de continuar rastreável ao upstream. Fica no
             * `SidebarContent` — e não no `<Sidebar>` inteiro — para não
             * embrulhar o menu da conta no rodapé, que não é navegação.
             */}
            <SidebarContent role="navigation" aria-label="Navegação principal">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {footerNavItems.map((item) => (
                    <NavFooter key={item.title} items={[item]} />
                ))}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
