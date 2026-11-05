import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import AppLayout from '@/layouts/app-layout';
import AuthCardLayout from '@/layouts/auth/auth-card-layout';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { user } from '@/tests/factories';
import { setPage } from '@/tests/inertia-mock';

describe('layouts', () => {
    it('app layouts', () => {
        setPage({ auth: { user: user() } }, '/instituicoes');
        render(
            <TooltipProvider>
                <AppLayout breadcrumbs={[{ title: 'a', href: '/a' }]}>
                    conteudo-a
                </AppLayout>
            </TooltipProvider>,
        );
        expect(screen.getByText('conteudo-a')).toBeInTheDocument();
        render(
            <TooltipProvider>
                <AppSidebarLayout>conteudo-b</AppSidebarLayout>
            </TooltipProvider>,
        );
        render(
            <TooltipProvider>
                <AppHeaderLayout>conteudo-c</AppHeaderLayout>
            </TooltipProvider>,
        );
        expect(screen.getByText('conteudo-c')).toBeInTheDocument();
    });
    it('auth layouts', () => {
        render(
            <AuthLayout title="Titulo" description="Desc">
                x1
            </AuthLayout>,
        );
        render(
            <AuthCardLayout title="Card" description="d">
                x2
            </AuthCardLayout>,
        );
        render(
            <AuthSimpleLayout title="Simple" description="d">
                x3
            </AuthSimpleLayout>,
        );
        render(
            <AuthSplitLayout title="Split" description="d">
                x4
            </AuthSplitLayout>,
        );
        expect(screen.getByText('x4')).toBeInTheDocument();
    });
    it('settings layout', () => {
        setPage({}, '/settings/profile');
        render(<SettingsLayout>filho</SettingsLayout>);
        expect(screen.getByText('filho')).toBeInTheDocument();
        expect(screen.getByText('Configurações')).toBeInTheDocument();
    });
});
