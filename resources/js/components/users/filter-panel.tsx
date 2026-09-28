import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Role } from '@/types';
import { EyeOff, Shield, X, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export type UserFilterParams = {
    search?: string;
    role_id?: string | number;
    is_active?: boolean | string;
    has_individual_permissions?: boolean | string;
    sort_by?: string;
    sort_order?: string;
};

interface FilterPanelProps {
    filters: UserFilterParams;
    roles: Role[];
    onFilterChange: (key: string, value: string | number | boolean | undefined) => void;
    onClearFilters: () => void;
    onClearSingleFilter?: (key: string) => void;
    isSearching?: boolean;
}

export function FilterPanel({
    filters,
    roles = [],
    isSearching = false,
    onFilterChange,
    onClearFilters,
    onClearSingleFilter = (key) => {
        onFilterChange(key, undefined);
    },
}: FilterPanelProps) {
    const renderFilterField = (label: ReactNode, key: string, children: ReactNode) => {
        const hasValue =
            key === 'role_id'
                ? filters.role_id !== undefined && filters.role_id !== 'all'
                : key === 'is_active'
                  ? filters.is_active !== undefined && filters.is_active !== 'all'
                  : key === 'has_individual_permissions'
                    ? filters.has_individual_permissions === true || filters.has_individual_permissions === 'true'
                    : !!filters[key as keyof UserFilterParams];

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor={key}>{label}</Label>
                    {hasValue && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-muted/80 dark:hover:bg-muted/60 dark:hover:text-foreground h-6 px-2 text-xs"
                            onClick={() => onClearSingleFilter(key)}
                            aria-label="Limpar filtro"
                        >
                            <XCircle className="mr-1 h-3 w-3" />
                            Limpar
                        </Button>
                    )}
                </div>
                {children}
            </div>
        );
    };

    const hasAnyFilter =
        filters.role_id !== undefined ||
        filters.is_active !== undefined ||
        filters.has_individual_permissions !== undefined ||
        filters.search !== undefined;

    return (
        <div className="bg-muted/30 border-t p-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Role Filter */}
                {renderFilterField(
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Shield className="h-4 w-4 text-cyan-600" />
                        Cargo
                    </div>,
                    'role_id',
                    <Select
                        value={filters.role_id?.toString() || 'all'}
                        onValueChange={(value) => onFilterChange('role_id', value === 'all' ? undefined : Number(value))}
                        aria-label="Filtrar por cargo"
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Todos os cargos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role.id || role.name} value={(role.id || role.name).toString()}>
                                    {role.label || role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>,
                )}

                {/* Status Filter */}
                {renderFilterField(
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                        <EyeOff className="h-4 w-4 text-gray-600 dark:text-cyan-600" />
                        Status
                    </div>,
                    'is_active',
                    <Select
                        value={
                            filters.is_active === undefined
                                ? 'all'
                                : filters.is_active === true || filters.is_active === 'true'
                                  ? 'active'
                                  : 'inactive'
                        }
                        onValueChange={(value) => onFilterChange('is_active', value === 'all' ? undefined : value === 'active' ? true : false)}
                        aria-label="Filtrar por status"
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Ativos</SelectItem>
                            <SelectItem value="inactive">Inativos</SelectItem>
                        </SelectContent>
                    </Select>,
                )}

                {/* Individual Permissions Filter */}
                {renderFilterField(
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Shield className="h-4 w-4 text-cyan-600" />
                        Permissões Individuais
                    </div>,
                    'has_individual_permissions',
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="has_individual_permissions"
                            checked={filters.has_individual_permissions === true || filters.has_individual_permissions === 'true'}
                            onCheckedChange={(checked) => onFilterChange('has_individual_permissions', checked ? true : undefined)}
                            aria-label="Apenas com permissões individuais"
                        />
                        <Label htmlFor="has_individual_permissions" className="cursor-pointer text-sm font-normal">
                            Apenas com permissões individuais
                        </Label>
                    </div>,
                )}
            </div>

            {/* Clear All Filters Button */}
            {hasAnyFilter && (
                <div className="mt-3 flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearFilters}
                        className="hover:bg-muted/80 dark:hover:bg-muted/60 dark:hover:text-foreground dark:hover:border-border h-9 text-sm"
                        aria-label="Limpar todos os filtros"
                        loading={isSearching}
                        loadingText="Limpar todos os filtros"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Limpar todos os filtros
                    </Button>
                </div>
            )}
        </div>
    );
}
