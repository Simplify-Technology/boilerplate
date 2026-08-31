import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/use-permissions';
import { toastErrorOptions, toastPromiseOptions } from '@/lib/toast-config';
import { Role } from '@/types';
import { useForm } from '@inertiajs/react';
import { Shield, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

type AssignRoleUserProps = {
    userId: number;
    roles: Record<string, Role> | Role[];
    currentRole?: string;
    currentRoleLabel?: string;
    onClose: () => void;
};

export default function AssignRoleUser({ userId, roles, onClose, currentRole, currentRoleLabel }: AssignRoleUserProps) {
    const { hasPermission, hasRole } = usePermissions();
    const isSuperUser = hasRole('super_user');

    // Verifica se o usuário tem permissão para atribuir roles
    const canAssignRoles = hasPermission('assign_roles');

    const { data, setData, post, processing } = useForm({ role: currentRole ?? '' });
    const [open, setOpen] = useState(true);

    const handleRoleChange = useCallback(
        (value: string) => {
            if (data.role !== value) {
                setData('role', value);
            }
        },
        [data.role, setData],
    );

    const assignRole = async () => {
        if (!canAssignRoles) {
            toast.error('Você não tem permissão para atribuir cargos!', toastErrorOptions);
            return;
        }

        await toast.promise(
            new Promise((resolve, reject) => {
                post(route('user.assign-role', { role: data.role, user: userId }), {
                    preserveScroll: true,
                    onSuccess: () => {
                        resolve('Cargo atualizado com sucesso!');
                        setOpen(false);
                        onClose();
                    },
                    onError: ({ error }) => {
                        reject(error);
                        setOpen(false);
                        onClose();
                    },
                });
            }),
            {
                loading: 'Atribuindo cargo...',
                success: (message) => String(message),
                error: (error) => String(error),
            },
            toastPromiseOptions,
        );
    };

    const handleOnOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
        setOpen(open);
    };

    // Converte roles para array se necessário
    // As roles já vêm filtradas do backend pelo RoleFilterService
    // Este filtro é apenas uma camada adicional de segurança no frontend
    const filteredRoles = useMemo(() => {
        const rolesArray = Array.isArray(roles)
            ? roles
            : Object.entries(roles).map(([key, role]) => ({
                  name: key,
                  label: role.label || role.name || key,
                  id: (role as Role).id,
              }));

        // Proteção adicional: Remove SUPER_USER se o usuário não for SUPER_USER
        // (as roles já vêm filtradas do backend, mas isso é uma camada extra de segurança)
        let filtered = rolesArray.filter((role) => {
            if (role.name === 'super_user' && !isSuperUser) {
                return false;
            }
            return true;
        });

        // Se o cargo atual não estiver na lista, inclui ele para que apareça selecionado
        // Isso garante que o cargo atual seja exibido mesmo que não esteja na lista de roles atribuíveis
        if (currentRole && !filtered.some((role) => role.name === currentRole)) {
            // Busca o role completo na lista original (rolesArray já contém todos os roles passados)
            const originalRole = rolesArray.find((role) => role.name === currentRole);
            if (originalRole) {
                filtered.push(originalRole);
            } else {
                // Se não encontrou na lista original, tenta buscar na lista completa de roles
                // (roles pode ser um array ou objeto)
                const allRolesArray = Array.isArray(roles) ? roles : Object.values(roles);

                const foundRole = allRolesArray.find((role: Role) => {
                    if (typeof role !== 'object' || role === null) return false;
                    return 'name' in role && role.name === currentRole;
                });

                if (foundRole && typeof foundRole === 'object' && 'name' in foundRole) {
                    // Se encontrou, usa o role completo com label
                    filtered.push({
                        name: foundRole.name,
                        label: foundRole.label || foundRole.name,
                        id: foundRole.id || 0,
                    });
                } else {
                    // Último recurso: cria um objeto temporário
                    // Usa a label fornecida se disponível, senão formata o nome
                    const label =
                        currentRoleLabel ||
                        currentRole
                            .split('_')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                    filtered.push({
                        name: currentRole,
                        label: label,
                        id: 0,
                    });
                }
            }
        }

        return filtered;
    }, [roles, isSuperUser, currentRole, currentRoleLabel]);

    return (
        <Dialog open={open} onOpenChange={handleOnOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Atribuir Cargo</span>
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">Selecione o cargo que deseja atribuir a esse usuário.</DialogDescription>
                </DialogHeader>

                <Separator />

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="role">Cargo</Label>
                        <Select value={data.role} onValueChange={handleRoleChange}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Selecione um cargo" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredRoles.length === 0 ? (
                                    <SelectItem value="" disabled>
                                        Nenhum cargo disponível
                                    </SelectItem>
                                ) : (
                                    filteredRoles.map((role) => (
                                        <SelectItem key={role.name || ''} value={role.name || ''}>
                                            {role.label || role.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                <DialogFooter className="sm:justify-between">
                    <p className="text-muted-foreground text-xs">Pressione ESC para fechar</p>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => handleOnOpenChange(false)} disabled={processing}>
                            <X className="h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={assignRole}
                            disabled={processing || !data.role}
                            className="gap-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            {processing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Atribuindo...
                                </>
                            ) : (
                                <>
                                    <Shield className="h-4 w-4" />
                                    Atribuir
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
