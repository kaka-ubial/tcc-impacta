import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopbar } from '@/components/app-topbar';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({ children }: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppTopbar />
                <div className="mx-auto w-full max-w-6xl flex-1 px-6 pt-2 pb-10">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
