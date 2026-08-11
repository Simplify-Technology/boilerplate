import HeadingSmall from '@/components/heading-small';
import { Role } from '@/types';
import { Box, Flex, Tabs } from '@radix-ui/themes';
import { ReactNode } from 'react';

interface PermissionsLayoutProps {
    roles?: Role[];
    children: ReactNode;
}

export default function PermissionsLayout({ roles, children }: PermissionsLayoutProps) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="px-4 py-6">
            {/*<Heading title="Configurações" description="Configure preferências do sistema" />*/}

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <Tabs.Root defaultValue="admin" className={'flex flex-1 flex-col gap-x-8 sm:flex-row sm:justify-between'}>
                    <Flex gap={'4'} className="flex flex-1 flex-col space-y-8 gap-x-8 sm:flex-row sm:space-y-0 sm:space-x-6">
                        <aside className="w-full max-w-3xl sm:w-52">
                            <HeadingSmall title="Cargos" description={'Escolha um cargo para ver e mudar o que ele libera.'} />
                            <Tabs.List className={'mt-6 !shadow-none'}>
                                <nav className="flex w-full flex-col space-y-1 space-x-0">
                                    {roles &&
                                        Object.entries(roles).map(([key, value]) => (
                                            <Tabs.Trigger key={key} value={key}>
                                                {value.label}
                                            </Tabs.Trigger>
                                        ))}
                                </nav>
                            </Tabs.List>
                        </aside>

                        <Box width={'100%'}>{children}</Box>
                    </Flex>
                </Tabs.Root>
            </div>
        </div>
    );
}
