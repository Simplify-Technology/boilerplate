import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage<SharedData>();
    const { hasPermission, hasRole } = usePermissions();

    // Filtrar items baseado em permissões e roles
    const filteredItems = items.filter((item) => {
        // Se não tem permissão ou role definida, sempre mostra
        if (!item.permission && !item.role) {
            return true;
        }

        // Verifica permissão se especificada
        if (item.permission) {
            return hasPermission(item.permission);
        }

        // Verifica role se especificada
        if (item.role) {
            return hasRole(item.role);
        }

        return true;
    });

    // Função para verificar se um item está ativo
    const isItemActive = (item: NavItem): boolean => {
        // Extrai o pathname da URL atual (remove query parameters e hash)
        const currentPath = page.url.split('?')[0].split('#')[0];
        const itemPath = item.url.split('?')[0].split('#')[0];

        // Se o pathname exato corresponde, está ativo
        if (itemPath === currentPath) {
            return true;
        }

        // Para rotas que devem ficar ativas em sub-rotas (ex: /users em /users/create, /users/1, etc)
        // Verifica se o pathname atual começa com o pathname do item + '/' ou é exatamente igual
        // Mas evita falsos positivos (ex: /users não deve ativar /user)
        if (currentPath.startsWith(itemPath + '/') || currentPath === itemPath) {
            return true;
        }

        return false;
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
            <SidebarMenu>
                {filteredItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isItemActive(item)}>
                            <Link href={item.url} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
