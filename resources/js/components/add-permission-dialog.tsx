import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AddPermissionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        id: number;
        name: string;
        custom_permissions_list: Array<{
            name: string;
            label: string;
            meta?: {
                can_impersonate_any?: boolean;
            };
        }>;
    };
}

interface Permission {
    id: number;
    name: string;
    label: string;
}

export function AddPermissionDialog({ open, onOpenChange, user }: AddPermissionDialogProps) {
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedPermission, setSelectedPermission] = useState<string>('');
    const [canImpersonateAny, setCanImpersonateAny] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch permissions when dialog opens
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            fetch(route('users.permissions.show', user.id))
                .then((res) => {
                    if (!res.ok) {
                        throw new Error('Erro ao carregar permissões');
                    }
                    return res.json();
                })
                .then((data) => {
                    setAllPermissions(data.all_permissions || []);
                    setIsLoading(false);
                })
                .catch(() => {
                    setIsLoading(false);
                    setAllPermissions([]);
                });
        } else {
            // Reset state when dialog closes
            setSelectedPermission('');
            setCanImpersonateAny(false);
            setAllPermissions([]);
        }
    }, [open, user.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPermission) return;

        setIsSubmitting(true);

        const formData = {
            permission: selectedPermission,
            ...(selectedPermission === 'impersonate_users' && { can_impersonate_any: canImpersonateAny }),
        };

        router.post(route('users.permissions.grant', user.id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                setSelectedPermission('');
                setCanImpersonateAny(false);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleClose = () => {
        onOpenChange(false);
        setSelectedPermission('');
        setCanImpersonateAny(false);
    };

    // Get available permissions (not already assigned)
    const userPermissionNames = user.custom_permissions_list.map((p) => p.name);
    const availablePermissions = allPermissions.filter((p) => !userPermissionNames.includes(p.name));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span>Adicionar Permissão</span>
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        Conceder uma nova permissão individual para <strong>{user.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <Separator />

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Permission Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="permission">Permissão</Label>
                        <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma permissão" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <div className="text-muted-foreground px-2 py-1.5 text-sm">Carregando permissões...</div>
                                ) : availablePermissions.length === 0 ? (
                                    <div className="text-muted-foreground px-2 py-1.5 text-sm">Todas as permissões já foram concedidas</div>
                                ) : (
                                    availablePermissions.map((permission) => (
                                        <SelectItem key={permission.id} value={permission.name}>
                                            {permission.label}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Special options for impersonate_users permission */}
                    {selectedPermission === 'impersonate_users' && (
                        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <span>Opções Especiais</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="can_impersonate_any"
                                        checked={canImpersonateAny}
                                        onCheckedChange={(checked) => setCanImpersonateAny(checked as boolean)}
                                    />
                                    <Label htmlFor="can_impersonate_any" className="text-sm dark:text-amber-50/90">
                                        Pode personificar qualquer usuário (incluindo SUPER_USER)
                                    </Label>
                                </div>
                                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300/80">
                                    Se desmarcado, só poderá personificar usuários com papel de menor prioridade.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Current permissions preview */}
                    {user.custom_permissions_list.length > 0 && (
                        <div className="bg-muted/50 dark:bg-muted/30 border-border/50 rounded-lg border p-4">
                            <Label className="text-sm font-medium">Permissões Atuais</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {user.custom_permissions_list.map((permission) => (
                                    <Badge key={permission.name} variant="outline" className="text-xs">
                                        {permission.label}
                                        {permission.meta?.can_impersonate_any && (
                                            <span className="ml-1 text-amber-600 dark:text-amber-400">(Qualquer)</span>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </form>

                <Separator />

                <DialogFooter className="sm:justify-between">
                    <p className="text-muted-foreground text-xs">Pressione ESC para fechar</p>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                            <X className="h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            loadingText="Concedendo..."
                            disabled={!selectedPermission || availablePermissions.length === 0}
                            className="gap-2 bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Conceder Permissão
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
