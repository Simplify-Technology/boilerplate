import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import type { UserFormData, UserFormProps } from '@/types/users';
import { applyCpfCnpjMask, applyMobileMask, applyPhoneMask } from '@/utils/format/masks';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function UserForm({
    user,
    roles,
    onSubmit,
    isProcessing: externalProcessing,
    errors: externalErrors = {},
    routeName,
    routeParams = {},
}: UserFormProps) {
    const { hasPermission } = usePermissions();
    const canAssignRoles = hasPermission('assign_roles');

    // Aplicar máscaras nos dados iniciais se vierem do backend
    const initialCpfCnpj = user?.cpf_cnpj ? applyCpfCnpjMask(user.cpf_cnpj) : '';
    const initialPhone = user?.phone ? applyPhoneMask(user.phone) : '';
    const initialMobile = user?.mobile ? applyMobileMask(user.mobile) : '';

    const form = useForm<UserFormData>({
        name: user?.name || '',
        email: user?.email || '',
        cpf_cnpj: initialCpfCnpj,
        phone: initialPhone,
        mobile: initialMobile,
        password: '',
        password_confirmation: '',
        role_id: user?.role?.id || null,
        is_active: user?.is_active ?? true,
        user_notes: user?.user_notes || '',
    });

    // Explicitly type data to avoid TypeScript inference issues
    const data = form.data as UserFormData;
    const setData = form.setData as <K extends keyof UserFormData>(key: K, value: UserFormData[K]) => void;
    const { post, put, processing: formProcessing, errors: formErrors } = form;

    const processing = externalProcessing ?? formProcessing;
    const errors: Record<string, string> = { ...formErrors, ...externalErrors };

    // Helper function to clean form data before submission
    const cleanFormData = (formData: UserFormData): Partial<UserFormData> => {
        const cleaned: Partial<UserFormData> = { ...formData };

        // Remove password fields if empty (for update)
        if (user && !cleaned.password) {
            delete cleaned.password;
            delete cleaned.password_confirmation;
        }

        // Ensure role_id is null (not 0 or empty string) when no role is selected
        if (cleaned.role_id === null || cleaned.role_id === undefined || cleaned.role_id === 0) {
            cleaned.role_id = null;
        }

        // Clean empty optional fields
        if (!cleaned.cpf_cnpj) cleaned.cpf_cnpj = undefined;
        if (!cleaned.phone) cleaned.phone = undefined;
        if (!cleaned.mobile) cleaned.mobile = undefined;
        if (!cleaned.user_notes) cleaned.user_notes = undefined;

        return cleaned;
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const cleanedData = cleanFormData(data);

        if (onSubmit) {
            onSubmit(cleanedData as UserFormData);
        } else {
            // Update form data with cleaned values before submission
            if (cleanedData.cpf_cnpj !== data.cpf_cnpj) {
                setData('cpf_cnpj', cleanedData.cpf_cnpj ?? '');
            }
            if (cleanedData.phone !== data.phone) {
                setData('phone', cleanedData.phone ?? '');
            }
            if (cleanedData.mobile !== data.mobile) {
                setData('mobile', cleanedData.mobile ?? '');
            }
            if (cleanedData.user_notes !== data.user_notes) {
                setData('user_notes', cleanedData.user_notes ?? '');
            }
            if (cleanedData.role_id !== data.role_id) {
                setData('role_id', cleanedData.role_id ?? null);
            }
            if (user && !cleanedData.password) {
                setData('password', '');
                setData('password_confirmation', '');
            }

            // Submit using Inertia - it will use the updated form data
            if (user) {
                put(route(routeName, { ...routeParams, user: user.id }), {
                    preserveScroll: true,
                });
            } else {
                post(route(routeName, routeParams), {
                    preserveScroll: true,
                });
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Nome */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-foreground text-sm font-medium">
                            Nome
                            <span className="text-destructive/70 ml-1">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                            placeholder="Nome completo"
                            aria-invalid={errors.name ? true : undefined}
                            className="transition-all duration-200"
                        />
                        <InputError message={errors.name} />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-foreground text-sm font-medium">
                            Email
                            <span className="text-destructive/70 ml-1">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="email@exemplo.com"
                            aria-invalid={errors.email ? true : undefined}
                            className="transition-all duration-200"
                        />
                        <InputError message={errors.email} />
                    </div>

                    {/* CPF/CNPJ */}
                    <div className="space-y-1.5">
                        <Label htmlFor="cpf_cnpj" className="text-foreground text-sm font-medium">
                            CPF/CNPJ
                            <span className="text-muted-foreground/60 ml-1.5 text-xs font-normal">(opcional)</span>
                        </Label>
                        <Input
                            id="cpf_cnpj"
                            value={data.cpf_cnpj || ''}
                            onChange={(e) => {
                                const masked = applyCpfCnpjMask(e.target.value);
                                setData('cpf_cnpj', masked);
                            }}
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            aria-invalid={errors.cpf_cnpj ? true : undefined}
                            className="transition-all duration-200"
                            maxLength={18}
                        />
                        <InputError message={errors.cpf_cnpj} />
                    </div>

                    {/* Cargo - Só aparece se o usuário tiver permissão assign_roles */}
                    {canAssignRoles && (
                        <div className="space-y-1.5">
                            <Label htmlFor="role_id" className="text-foreground text-sm font-medium">
                                Cargo
                                <span className="text-muted-foreground/60 ml-1.5 text-xs font-normal">(opcional)</span>
                            </Label>
                            <Select
                                value={data.role_id ? data.role_id.toString() : 'none'}
                                onValueChange={(value) => {
                                    // Se value é 'none', seta null, senão converte para number
                                    setData('role_id', value === 'none' ? null : Number(value));
                                }}
                            >
                                <SelectTrigger id="role_id" aria-invalid={errors.role_id ? true : undefined} className="transition-all duration-200">
                                    <SelectValue placeholder="Selecione um cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem cargo</SelectItem>
                                    {Array.isArray(roles) && roles.length > 0
                                        ? roles.map((role) => {
                                              const roleId = role.id || role.name;
                                              return (
                                                  <SelectItem key={roleId} value={roleId.toString()}>
                                                      {role.label || role.name}
                                                  </SelectItem>
                                              );
                                          })
                                        : null}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.role_id} />
                        </div>
                    )}
                </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-5">
                <Separator className="my-1" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Telefone */}
                    <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-foreground text-sm font-medium">
                            Telefone
                            <span className="text-muted-foreground/60 ml-1.5 text-xs font-normal">(opcional)</span>
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={data.phone || ''}
                            onChange={(e) => {
                                const masked = applyPhoneMask(e.target.value);
                                setData('phone', masked);
                            }}
                            placeholder="(00) 0000-0000"
                            aria-invalid={errors.phone ? true : undefined}
                            className="transition-all duration-200"
                            maxLength={14}
                        />
                        <InputError message={errors.phone} />
                    </div>

                    {/* Celular */}
                    <div className="space-y-1.5">
                        <Label htmlFor="mobile" className="text-foreground text-sm font-medium">
                            Celular
                            <span className="text-muted-foreground/60 ml-1.5 text-xs font-normal">(opcional)</span>
                        </Label>
                        <Input
                            id="mobile"
                            type="tel"
                            value={data.mobile || ''}
                            onChange={(e) => {
                                const masked = applyMobileMask(e.target.value);
                                setData('mobile', masked);
                            }}
                            placeholder="(00) 00000-0000"
                            aria-invalid={errors.mobile ? true : undefined}
                            className="transition-all duration-200"
                            maxLength={15}
                        />
                        <InputError message={errors.mobile} />
                    </div>
                </div>
            </div>

            {/* Senha */}
            <div className="space-y-5">
                <Separator className="my-1" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-foreground text-sm font-medium">
                            {user ? 'Nova Senha' : 'Senha'}
                            {!user && <span className="text-destructive/70 ml-1">*</span>}
                            {user && <span className="text-muted-foreground/60 ml-1.5 text-xs font-normal">(opcional)</span>}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            placeholder={user ? 'Deixe em branco para manter a atual' : 'Mínimo 8 caracteres'}
                            aria-invalid={errors.password ? true : undefined}
                            className="transition-all duration-200"
                        />
                        <InputError message={errors.password} />
                        {user && <p className="text-muted-foreground/70 text-xs leading-relaxed">Deixe em branco para manter a senha atual</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password_confirmation" className="text-foreground text-sm font-medium">
                            {user ? 'Confirmar Nova Senha' : 'Confirmar Senha'}
                            {!user && <span className="text-destructive/70 ml-1">*</span>}
                            {user && <span className="text-muted-foreground/60 ml-1.5 text-xs font-normal">(opcional)</span>}
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            placeholder="Confirme a senha"
                            aria-invalid={errors.password_confirmation ? true : undefined}
                            className="transition-all duration-200"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>
            </div>

            {/* Status e Configurações */}
            <div className="space-y-5">
                <Separator className="my-1" />
                <div className="space-y-5">
                    {/* Status Ativo */}
                    <div className="border-border/40 bg-muted/20 dark:bg-muted/30 flex items-start space-x-3 rounded-md border p-4 transition-colors duration-200">
                        <Checkbox
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked === true)}
                            className="mt-0.5 data-[state=checked]:border-cyan-600 data-[state=checked]:bg-cyan-600 dark:data-[state=checked]:border-cyan-500 dark:data-[state=checked]:bg-cyan-500"
                        />
                        <div className="flex-1 space-y-0.5">
                            <Label htmlFor="is_active" className="text-foreground cursor-pointer text-sm font-medium">
                                Usuário ativo
                            </Label>
                            <p className="text-muted-foreground/70 text-xs leading-relaxed">Usuários inativos não podem fazer login no sistema</p>
                        </div>
                        <InputError message={errors.is_active} />
                    </div>

                    {/* Notas */}
                    <div className="space-y-1.5">
                        <Label htmlFor="user_notes" className="text-foreground text-sm font-medium">
                            Notas
                            <span className="text-muted-foreground/60 ml-1.5 text-xs font-normal">(opcional)</span>
                        </Label>
                        <Textarea
                            id="user_notes"
                            value={data.user_notes || ''}
                            onChange={(e) => setData('user_notes', e.target.value)}
                            placeholder="Informações adicionais sobre o usuário..."
                            rows={4}
                            aria-invalid={errors.user_notes ? true : undefined}
                            className="resize-none transition-all duration-200"
                        />
                        <InputError message={errors.user_notes} />
                        <p className="text-muted-foreground/70 text-xs leading-relaxed">
                            Use este campo para registrar observações, lembretes ou informações relevantes sobre o usuário
                        </p>
                    </div>
                </div>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-4 pt-2">
                <Button
                    type="submit"
                    loading={processing}
                    loadingText="Salvando..."
                    className="bg-cyan-600 text-white transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-700 active:scale-95 dark:bg-cyan-600 dark:text-white dark:shadow-lg dark:hover:bg-cyan-700 dark:hover:shadow-xl"
                >
                    {user ? 'Atualizar Usuário' : 'Criar Usuário'}
                </Button>
            </div>
        </form>
    );
}
