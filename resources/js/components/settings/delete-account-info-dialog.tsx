import { ModuleInfoDialog } from '@/components/dialogs/module-info-dialog';
import type { InfoSection } from '@/types/dialogs';
import { AlertTriangle, Shield, Trash2, Zap } from 'lucide-react';

interface DeleteAccountInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Componente de diálogo de informações sobre a exclusão de conta
 */
export function DeleteAccountInfoDialog({ open, onOpenChange }: DeleteAccountInfoDialogProps) {
    const sections: InfoSection[] = [
        {
            title: 'O que acontece ao excluir',
            icon: AlertTriangle,
            iconColor: 'text-state-destructive',
            content: (
                <div className="space-y-2 text-sm leading-relaxed">
                    <p>
                        Ao excluir sua conta, todas as suas informações e dados serão permanentemente removidos do sistema. Esta ação é{' '}
                        <strong className="text-state-destructive">irreversível</strong>.
                    </p>
                    <ul className="space-y-1.5 text-sm">
                        <li>• Todos os seus dados pessoais serão deletados</li>
                        <li>• Seu histórico e atividades serão removidos</li>
                        <li>• Você perderá acesso a todas as funcionalidades</li>
                        <li>• Não será possível recuperar a conta após exclusão</li>
                    </ul>
                </div>
            ),
        },
        {
            title: 'Processo de Exclusão',
            icon: Trash2,
            iconColor: 'text-state-destructive',
            content: (
                <div className="space-y-2 text-sm leading-relaxed">
                    <p>Para confirmar a exclusão, você precisará:</p>
                    <ul className="space-y-1.5 text-sm">
                        <li>1. Clicar no botão "Excluir Conta"</li>
                        <li>2. Confirmar sua identidade digitando sua senha atual</li>
                        <li>3. Confirmar novamente no diálogo de confirmação</li>
                        <li>4. A exclusão será processada imediatamente</li>
                    </ul>
                </div>
            ),
        },
        {
            title: 'Segurança',
            icon: Shield,
            iconColor: 'text-state-success',
            content: (
                <ul className="space-y-1.5 text-sm">
                    <li>• É necessário confirmar com sua senha para segurança</li>
                    <li>• A ação requer confirmação dupla para evitar exclusões acidentais</li>
                    <li>• Você será desconectado automaticamente após a exclusão</li>
                    <li>• Nenhum dado será mantido após a exclusão</li>
                </ul>
            ),
        },
        {
            title: 'Antes de Excluir',
            icon: Zap,
            iconColor: 'text-state-warning',
            content: (
                <ul className="space-y-1.5 text-sm">
                    <li>• Certifique-se de que realmente deseja excluir sua conta</li>
                    <li>• Faça backup de qualquer informação importante antes de excluir</li>
                    <li>• Considere desativar a conta temporariamente se precisar de tempo</li>
                    <li>• Entre em contato com o suporte se tiver dúvidas</li>
                    <li>• Lembre-se: esta ação não pode ser desfeita</li>
                </ul>
            ),
        },
    ];

    return (
        <ModuleInfoDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Informações sobre Exclusão de Conta"
            description="Entenda o processo e as consequências da exclusão permanente da sua conta."
            icon={Trash2}
            iconBgColor="bg-state-destructive"
            iconColor="text-state-destructive"
            sections={sections}
        />
    );
}
