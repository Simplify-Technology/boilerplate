import { ModuleInfoDialog } from '@/components/dialogs/module-info-dialog';
import { InfoFeatureList } from '@/components/page-info';
import type { InfoSection } from '@/types/dialogs';
import type { RoleInfoDialogProps } from '@/types/permissions';
import { Filter, Shield, Sparkles, Zap } from 'lucide-react';

/**
 * Diálogo de informações da tela de Cargos.
 *
 * O texto descreve o que esta tela faz de fato. A versão anterior prometia
 * "múltiplas funções por usuário", que nunca existiu: `users.role_id` é único.
 */
export function RoleInfoDialog({ open, onOpenChange }: RoleInfoDialogProps) {
    const sections: InfoSection[] = [
        {
            title: 'Para que serve',
            icon: Shield,
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            content: (
                <p className="text-sm leading-relaxed">
                    Cada pessoa tem <strong>um cargo</strong>, e o cargo decide o que ela consegue fazer no painel. Aqui você define esse pacote: o
                    que muda vale na hora para todo mundo que já está no cargo.
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
                        { label: 'Ver o que cada cargo libera hoje' },
                        { label: 'Marcar e desmarcar acessos de um cargo' },
                        { label: 'Ver quem está em cada cargo' },
                        { label: 'Tirar alguém de um cargo pela tabela de usuários' },
                    ]}
                />
            ),
        },
        {
            title: 'Como usar',
            icon: Filter,
            iconColor: 'text-orange-600 dark:text-orange-400',
            content: (
                <InfoFeatureList
                    features={[
                        { label: 'Escolha um cargo na lista à esquerda' },
                        { label: 'Marque o que ele deve liberar' },
                        { label: 'Clique em "Salvar Permissões"' },
                        { label: 'Confira na tabela quem foi afetado' },
                    ]}
                />
            ),
        },
        {
            title: 'Antes de salvar',
            icon: Zap,
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            content: (
                <ul className="space-y-1.5 text-sm">
                    <li>• Uma pessoa tem um cargo só — para trocar, use a tela de usuários</li>
                    <li>• Tirar um acesso do cargo tira de todo mundo que está nele, na mesma hora</li>
                    <li>• Você não consegue conceder um acesso que você mesmo não tem</li>
                    <li>• Cargos acima do seu não aparecem para edição</li>
                    <li>• Permissões extras dadas pessoa a pessoa continuam valendo, independentes do cargo</li>
                </ul>
            ),
        },
    ];

    return (
        <ModuleInfoDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Sobre a tela de Cargos"
            description="O que cada cargo libera, e quem está em cada um."
            icon={Shield}
            iconBgColor="bg-cyan-100 dark:bg-cyan-900/40"
            iconColor="text-cyan-600 dark:text-cyan-300"
            sections={sections}
        />
    );
}
