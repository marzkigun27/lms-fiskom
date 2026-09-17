import { AppSidebar } from '@/components/app-sidebar';
import type { AppLayoutProps } from '@/types';
import { useState } from 'react';

export default function AppSidebarLayout({
    children,
}: AppLayoutProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="bg-surface text-on-surface h-screen flex overflow-hidden">
            <AppSidebar
                isMobileOpen={isMobileOpen}
                onCloseMobile={() => setIsMobileOpen(false)}
            />
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background min-w-0">
                {/* Mobile TopAppBar */}
                <header className="bg-surface-container-lowest text-on-surface font-headline font-bold border-b-[4px] border-black dark:border-white sticky top-0 z-30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex justify-between items-center w-full px-6 py-4 md:hidden">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                            className="p-2 rounded-lg neo-border neo-shadow-sm bg-surface-container hover-neo flex items-center justify-center text-on-surface"
                            title="Toggle Navigation Menu"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div className="text-2xl font-black uppercase tracking-tight">PhysixLab</div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
