import { ModuleInfoDialog } from '@/components/dialogs/module-info-dialog';
import { InfoFeatureList } from '@/components/page-info';
import type { InfoSection } from '@/types/dialogs';
import type { UserInfoDialogProps } from '@/types/users';
import { Eye, Info, Shield, Sparkles, User2, Zap } from 'lucide-react';

/**
 * Componente específico de diálogo de informações sobre visualização de detalhes de usuário
 * Usa o componente genérico ModuleInfoDialog internamente
 */
export function UserShowInfoDialog({ open, onOpenChange }: UserInfoDialogProps) {
    const sections: InfoSection[] = [
        {
            title: 'Visão Geral',
            icon: Eye,
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            content: (
                <p className="text-sm leading-relaxed">
                    A página de detalhes do usuário exibe todas as informações completas sobre um usuário específico, incluindo dados pessoais,
                    configurações do sistema, permissões e histórico.
                </p>
            ),
        },
        {
            title: 'Informações Disponíveis',
            icon: Info,
            iconColor: 'text-blue-600 dark:text-blue-400',
            content: (
                <InfoFeatureList
                    features={[
                        { label: 'Dados pessoais completos (nome, email, CPF/CNPJ, telefones)' },
                        { label: 'Status de ativação da conta' },
                        { label: 'Cargo e permissões atribuídas' },
                        { label: 'Status de verificação de email' },
                        { label: 'Datas de criação e última atualização' },
                        { label: 'Notas e observações sobre o usuário' },
                        { label: 'Permissões diretas (além das do cargo)', badge: 'Avançado' },
                    ]}
                />
            ),
        },
        {
            title: 'Ações Disponíveis',
            icon: Sparkles,
            iconColor: 'text-purple-600 dark:text-purple-400',
            content: (
                <InfoFeatureList
                    features={[
                        { label: 'Editar usuário - Acesse o formulário de edição' },
                        { label: 'Voltar à listagem - Retorne para a página de usuários' },
                        { label: 'Visualizar permissões detalhadas' },
                        { label: 'Ver histórico de atividades (se disponível)' },
                    ]}
                />
            ),
        },
        {
            title: 'Entendendo as Informações',
            icon: Shield,
            iconColor: 'text-red-600 dark:text-red-400',
            content: (
                <ul className="space-y-1.5 text-sm">
                    <li>
                        • <strong>Status:</strong> quem está inativo não entra no painel, mas continua na lista
                    </li>
                    <li>
                        • <strong>Cargo:</strong> o pacote de acessos que a pessoa herda
                    </li>
                    <li>
                        • <strong>Permissões extras:</strong> acessos dados a esta pessoa, que somam aos do cargo
                    </li>
                    <li>
                        • <strong>E-mail verificado:</strong> sem confirmar, a pessoa não entra no painel
                    </li>
                    <li>
                        • <strong>Notas:</strong> anotações internas, visíveis só para quem administra
                    </li>
                </ul>
            ),
        },
        {
            title: 'Dicas de Uso',
            icon: Zap,
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            content: (
                <ul className="space-y-1.5 text-sm">
                    <li>• Use o botão "Editar" para modificar informações do usuário</li>
                    <li>• Verifique as permissões diretas para entender acesso especial</li>
                    <li>• As notas podem conter informações importantes sobre o usuário</li>
                    <li>• O status de ativação afeta o acesso ao sistema</li>
                </ul>
            ),
        },
    ];

    return (
        <ModuleInfoDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Informações sobre Detalhes do Usuário"
            description="Entenda como visualizar e interpretar as informações detalhadas de um usuário na plataforma."
            icon={User2}
            iconBgColor="bg-cyan-100 dark:bg-cyan-900/40"
            iconColor="text-cyan-600 dark:text-cyan-300"
            sections={sections}
        />
    );
}
