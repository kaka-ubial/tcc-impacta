import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import AlertError from '@/components/alert-error';
import { AppContent } from '@/components/app-content';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { AppShell } from '@/components/app-shell';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CausaBadge } from '@/components/causa-badge';
import { CirandaBackdrop } from '@/components/ciranda-backdrop';
import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import PasswordInput from '@/components/password-input';
import { StatCard } from '@/components/stat-card';
import TextLink from '@/components/text-link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { VerificadaBadge } from '@/components/verificada-badge';
import { instUser, user } from '@/tests/factories';
import { router, setPage } from '@/tests/inertia-mock';

describe('componentes simples', () => {
    it('AlertError deduplica', () => {
        render(<AlertError errors={['a', 'a', 'b']} />);
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByText('Algo deu errado.')).toBeInTheDocument();
        render(<AlertError errors={[]} title="Custom" />);
        expect(screen.getByText('Custom')).toBeInTheDocument();
    });
    it('AppContent e AppShell', () => {
        render(
            <SidebarProvider>
                <AppContent>dentro</AppContent>
            </SidebarProvider>,
        );
        render(<AppContent variant="header">header</AppContent>);
        render(<AppShell variant="header">h</AppShell>);
        render(<AppShell>s</AppShell>);
        expect(screen.getByText('header')).toBeInTheDocument();
    });
    it('logos', () => {
        render(
            <>
                <AppLogo />
                <AppLogoIcon className="x" />
            </>,
        );
        expect(screen.getAllByLabelText('Logo Impacta').length).toBeGreaterThan(
            0,
        );
    });
    it('Breadcrumbs', () => {
        const { container } = render(<Breadcrumbs breadcrumbs={[]} />);
        expect(container).toBeEmptyDOMElement();
        render(
            <Breadcrumbs
                breadcrumbs={[
                    { title: 'Home', href: '/' },
                    { title: 'Atual', href: '/a' },
                ]}
            />,
        );
        expect(screen.getByText('Home').closest('a')).toHaveAttribute(
            'href',
            '/',
        );
    });
    it('CausaBadge ícones', () => {
        render(
            <>
                {['paw', 'leaf', 'desconhecido', null].map((i, n) => (
                    <CausaBadge
                        key={n}
                        causa={{ id: n, nome: `c${n}`, icone: i }}
                    />
                ))}
            </>,
        );
        expect(screen.getByText('c3')).toBeInTheDocument();
    });
    it('Ciranda, Heading, InputError, StatCard, TextLink', () => {
        render(<CirandaBackdrop />);
        render(
            <>
                <Heading title="T1" description="d" />
                <Heading title="T2" variant="small" />
                <Heading title="T3" variant="page" description="dd" />
                <Heading title="T4" variant="page" />
            </>,
        );
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(2);
        render(
            <>
                <InputError message="ruim" />
                <InputError />
            </>,
        );
        expect(screen.getByRole('alert')).toHaveTextContent('ruim');
        render(<StatCard title="Total" value={5} />);
        render(<TextLink href="/x">ir</TextLink>);
        expect(screen.getByText('ir')).toHaveAttribute('href', '/x');
    });
    it('DataTable estados', () => {
        const cols = [{ label: 'N', render: (i: { n: string }) => i.n }];
        const { rerender } = render(
            <DataTable data={[]} columns={cols} loading />,
        );
        rerender(<DataTable data={[]} columns={cols} />);
        expect(
            screen.getByText('Nenhum registro encontrado.'),
        ).toBeInTheDocument();
        rerender(<DataTable data={[]} columns={cols} emptyMessage="vazio" />);
        rerender(<DataTable data={[{ n: 'x1' }]} columns={cols} />);
        expect(screen.getByText('x1')).toBeInTheDocument();
    });
    it('NavFooter e NavMain', () => {
        setPage({}, '/a');
        render(
            <TooltipProvider>
                <SidebarProvider>
                    <NavFooter
                        items={[
                            {
                                title: 'Docs',
                                href: 'https://x.com',
                                icon: Home,
                            },
                            { title: 'Sem', href: '/s' },
                        ]}
                    />
                    <NavMain
                        items={[
                            { title: 'A', href: '/a', icon: Home },
                            { title: 'B', href: '/b' },
                        ]}
                    />
                    <NavMain items={undefined as any} />
                </SidebarProvider>
            </TooltipProvider>,
        );
        expect(screen.getByText('Docs').closest('a')).toHaveAttribute(
            'target',
            '_blank',
        );
    });
    it('PasswordInput alterna', async () => {
        render(<PasswordInput aria-label="pw" />);
        expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'password');
        await userEvent.setup().click(screen.getByRole('button'));
        expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'text');
    });
    it('UserInfo variantes', () => {
        render(<UserInfo user={user() as any} showEmail />);
        expect(screen.getByText('Ana Souza')).toBeInTheDocument();
        render(
            <UserInfo
                user={
                    instUser({
                        instituicao: {
                            nome_fantasia: 'Casa',
                            foto_perfil: 'f.png',
                        },
                    }) as any
                }
            />,
        );
        expect(screen.getByText('Casa')).toBeInTheDocument();
        render(<UserInfo user={user({ doador: undefined }) as any} />);
        expect(screen.getAllByText('ana@example.com').length).toBeGreaterThan(
            0,
        );
    });
    it('UserMenuContent', async () => {
        const u = userEvent.setup();

        for (const usr of [user(), instUser()]) {
            const { unmount } = render(
                <DropdownMenu open>
                    <DropdownMenuTrigger>t</DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <UserMenuContent user={usr as any} />
                    </DropdownMenuContent>
                </DropdownMenu>,
            );
            await u.click(screen.getByText('Sair'));
            expect(router.flushAll).toHaveBeenCalled();
            unmount();
        }
    });
    it('VerificadaBadge', () => {
        const { container } = render(<VerificadaBadge verificada={false} />);
        expect(container).toBeEmptyDOMElement();
        render(<VerificadaBadge verificada variant="full" />);
        expect(screen.getByText('Instituição Verificada')).toBeInTheDocument();
        render(
            <TooltipProvider>
                <VerificadaBadge verificada />
            </TooltipProvider>,
        );
    });
});
