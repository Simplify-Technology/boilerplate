import { ModuleInfoDialog } from '@/components/dialogs/module-info-dialog';
import { InfoFeatureList } from '@/components/page-info';
import type { InfoSection } from '@/types/dialogs';
import type { UserInfoDialogProps } from '@/types/users';
import { Filter, Shield, Sparkles, Users as UsersIcon, Zap } from 'lucide-react';

/**
 * Diálogo de informações da tela de usuários.
 *
 * O texto lista só o que a tela faz. A versão anterior anunciava "histórico de
 * atividades e auditoria" (o backend registra, mas não existe tela que mostre)
 * e "ordenação por colunas" (o controller aceita `sort_by`, mas os cabeçalhos
 * não são clicáveis).
 */
export function UserInfoDialog({ open, onOpenChange }: UserInfoDialogProps) {
    const sections: InfoSection[] = [
        {
            title: 'Para que serve',
            icon: UsersIcon,
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            content: (
                <p className="text-sm leading-relaxed">
                    Aqui ficam todas as contas do painel. É por esta tela que alguém entra na plataforma, muda de cargo, perde o acesso ou é excluído
                    de vez.
                </p>
            ),
        },
        {
            title: 'O que dá para fazer aqui',
            icon: Sparkles,
            iconColor: 'text-purple-600 dark:text-purple-400',
            content: (
                <InfoFeatureList
                    features={[
                        { label: 'Cadastrar uma pessoa e definir o cargo dela' },
                        { label: 'Editar dados de cadastro' },
                        { label: 'Desativar a conta — a pessoa deixa de entrar, o cadastro fica' },
                        { label: 'Dar ou tirar acessos avulsos, fora do cargo' },
                        { label: 'Excluir de vez, sem lixeira', badge: 'Definitivo' },
                    ]}
                />
            ),
        },
        {
            title: 'Achar alguém',
            icon: Filter,
            iconColor: 'text-orange-600 dark:text-orange-400',
            content: (
                <InfoFeatureList
                    features={[
                        { label: 'Busca por nome ou e-mail, enquanto você digita' },
                        { label: 'Filtro por cargo' },
                        { label: 'Filtro por status: ativo ou inativo' },
                    ]}
                />
            ),
        },
        {
            title: 'Cargos',
            icon: Shield,
            iconColor: 'text-red-600 dark:text-red-400',
            content: (
                <InfoFeatureList
                    features={[
                        { label: 'Super Usuário — faz tudo, inclusive sobre outros super usuários', badge: 'Máximo' },
                        { label: 'Administrador — gerencia pessoas e cargos abaixo do dele', badge: 'Gestão' },
                        { label: 'Gerente — cuida da equipe, sem mexer em cargos e permissões' },
                        { label: 'Visualizador e Visitante — sem acesso de gestão' },
                    ]}
                />
            ),
        },
        {
            title: 'Bom saber',
            icon: Zap,
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            content: (
                <ul className="space-y-1.5 text-sm">
                    <li>• Quem está inativo não entra no painel, mas continua na lista</li>
                    <li>• Sem o e-mail confirmado, a pessoa também não entra</li>
                    <li>• Você só age sobre quem está abaixo do seu cargo — nem sobre iguais, nem sobre você mesmo</li>
                    <li>• Excluir é definitivo: para tirar o acesso sem perder o cadastro, desative</li>
                    <li>• Acessos avulsos somam aos do cargo e não somem quando o cargo muda</li>
                </ul>
            ),
        },
    ];

    return (
        <ModuleInfoDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Sobre a tela de usuários"
            description="Quem entra no painel, com qual cargo, e o que cada ação faz de verdade."
            icon={UsersIcon}
            iconBgColor="bg-cyan-100 dark:bg-cyan-900/40"
            iconColor="text-cyan-600 dark:text-cyan-300"
            sections={sections}
        />
    );
}
