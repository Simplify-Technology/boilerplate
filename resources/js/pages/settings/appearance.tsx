import { Head } from '@inertiajs/react';
import { useCallback, useState } from 'react';

import AppearanceTabs from '@/components/appearance-tabs';
import { AppearanceInfoDialog } from '@/components/settings/appearance-info-dialog';
import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { type BreadcrumbItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { Info, Menu, Palette } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configurações',
        href: '/settings/appearance',
    },
];

export default function Appearance() {
    const currentPath = window.location.pathname;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showInfoDialog, setShowInfoDialog] = useState(false);

    const handleSelectItem = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configurações de Aparência" />
            <div className="flex h-full flex-1 flex-col gap-3 p-3 sm:p-4 md:gap-4 md:p-6">
                {/* Mobile Menu Button */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start gap-2 sm:w-auto">
                                <Menu className="h-4 w-4 shrink-0" />
                                <span className="font-medium">Configurações</span>
                                <span className="text-muted-foreground truncate text-xs">• Aparência</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0 sm:max-w-sm">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navegar Configurações</SheetTitle>
                            </SheetHeader>
                            <div className="h-full overflow-y-auto">
                                <SettingsSidebar currentPath={currentPath} onSelectItem={handleSelectItem} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 flex-col gap-3 overflow-hidden lg:flex-row lg:gap-4">
                    {/* Sidebar - Settings Navigation (Desktop) */}
                    <div className="hidden lg:block">
                        <SettingsSidebar currentPath={currentPath} />
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-card border-border/40 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
                        {/* Appearance Header */}
                        <div className="bg-muted/20 border-border/30 border-b backdrop-blur-sm">
                            <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <Palette className="h-4 w-4 shrink-0 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                    <h2 className="dark:text-foreground text-base font-semibold tracking-tight">Configurações de Aparência</h2>
                                    <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-400"
                                                aria-label="Informações sobre aparência"
                                            >
                                                <Info className="text-muted-foreground dark:text-muted-foreground/80 h-4 w-4 transition-colors duration-200" />
                                            </Button>
                                        </DialogTrigger>
                                    </Dialog>
                                    <AppearanceInfoDialog open={showInfoDialog} onOpenChange={setShowInfoDialog} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {/* Appearance Section */}
                            <div>
                                <div className="mb-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                        <h3 className="dark:text-foreground text-base font-semibold">Tema</h3>
                                    </div>
                                    <p className="text-muted-foreground dark:text-muted-foreground/70 text-sm">
                                        Personalize a aparência da sua conta escolhendo entre tema claro, escuro ou seguir as configurações do sistema
                                    </p>
                                </div>

                                <AppearanceTabs />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
