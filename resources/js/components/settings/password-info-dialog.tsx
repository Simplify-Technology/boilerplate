import { ModuleInfoDialog } from '@/components/dialogs/module-info-dialog';
import { InfoFeatureList } from '@/components/page-info';
import type { InfoSection } from '@/types/dialogs';
import { KeyRound, Lock, Shield, Zap } from 'lucide-react';

interface PasswordInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Componente de diálogo de informações sobre a seção de Senha
 */
export function PasswordInfoDialog({ open, onOpenChange }: PasswordInfoDialogProps) {
    const sections: InfoSection[] = [
        {
            title: 'Segurança da Senha',
            icon: Shield,
            iconColor: 'text-green-600 dark:text-green-400',
            content: (
                <div className="space-y-2 text-sm leading-relaxed">
                    <p>
                        Sua senha é a primeira linha de defesa da sua conta. É importante usar uma senha forte e única para proteger suas informações.
                    </p>
                    <ul className="space-y-1.5 text-sm">
                        <li>• Quanto mais longa, melhor — comprimento vale mais que símbolo</li>
                        <li>• Combine maiúsculas, minúsculas, números e símbolos</li>
                        <li>• Evite nome, data de nascimento e coisas que estão no seu perfil</li>
                        <li>• Não reutilize a senha de outra conta</li>
                    </ul>
                </div>
            ),
        },
        {
            title: 'Como Alterar',
            icon: KeyRound,
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            content: (
                <InfoFeatureList
                    features={[
                        { label: 'Digite sua senha atual para confirmar identidade' },
                        { label: 'Crie uma nova senha forte e segura' },
                        { label: 'Confirme a nova senha digitando novamente' },
                        { label: 'Clique em "Salvar Senha" para aplicar as alterações' },
                    ]}
                />
            ),
        },
        {
            title: 'O que o sistema exige',
            icon: Lock,
            iconColor: 'text-blue-600 dark:text-blue-400',
            content: (
                <div className="space-y-2 text-sm leading-relaxed">
                    <ul className="space-y-1.5">
                        <li>• Pelo menos 8 caracteres</li>
                        <li>• A senha atual, para confirmar que é você</li>
                        <li>• A nova senha digitada duas vezes iguais</li>
                    </ul>
                    <p className="text-muted-foreground">
                        É só isso. Maiúsculas, números e símbolos ajudam muito, mas o sistema não obriga — a conta fica tão protegida quanto a senha
                        que você escolher.
                    </p>
                </div>
            ),
        },
        {
            title: 'Dicas de Segurança',
            icon: Zap,
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            content: (
                <ul className="space-y-1.5 text-sm">
                    <li>• Use um gerenciador de senhas: ele cria e guarda senhas fortes por você</li>
                    <li>• Nunca compartilhe sua senha, nem com quem administra o painel</li>
                    <li>• Suspeitou de acesso indevido? Troque na hora e avise o responsável</li>
                    <li>• Trocar a senha por trocar não ajuda — troque quando houver motivo</li>
                </ul>
            ),
        },
    ];

    return (
        <ModuleInfoDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Informações sobre Senha"
            description="O que o sistema exige, e o que de fato protege sua conta."
            icon={Lock}
            iconBgColor="bg-cyan-100 dark:bg-cyan-900/40"
            iconColor="text-cyan-600 dark:text-cyan-300"
            sections={sections}
        />
    );
}
