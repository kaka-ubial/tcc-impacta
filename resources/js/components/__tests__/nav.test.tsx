import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AccessibilityPanel } from '@/components/accessibility/accessibility-panel';
import { AccessibilityProvider } from '@/components/accessibility/accessibility-provider';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopbar } from '@/components/app-topbar';
import { NotificationsMenu } from '@/components/notifications-menu';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { instUser, user } from '@/tests/factories';
import { router, setPage } from '@/tests/inertia-mock';

const wrap = (n: React.ReactNode) => (
    <TooltipProvider>
        <SidebarProvider>{n}</SidebarProvider>
    </TooltipProvider>
);

describe('AccessibilityPanel', () => {
    it('altera preferências', async () => {
        const u = userEvent.setup();
        render(<AccessibilityPanel />);
        await u.click(screen.getAllByRole('button')[0]);

        for (const name of [/escuro/i, /alto contraste/i, /claro/i]) {
            await u.click(await screen.findByText(name));
        }

        for (const name of [
            /daltonismo/i,
            /sublinhar/i,
            /foco/i,
            /animações/i,
            /anunciar/i,
        ]) {
            await u.click(screen.getByLabelText(name));
        }

        const fontes = screen
            .getAllByRole('button')
            .filter((b) => /^\d+%$/.test(b.textContent ?? ''));

        for (const f of fontes) {
            await u.click(f);
        }

        await u.click(
            screen.getByRole('button', { name: /restaurar|redefinir|padr/i }),
        );
    });
});

describe('AccessibilityProvider', () => {
    it('renderiza skip link e anuncia navegação', async () => {
        document.body.innerHTML = '';
        const main = document.createElement('main');
        document.body.appendChild(main);
        render(<AccessibilityProvider />, {
            container: document.body.appendChild(document.createElement('div')),
        });
        await userEvent
            .setup()
            .click(screen.getByText(/pular para o conteúdo/i));
        expect(main.id).toBe('conteudo-principal');
        const cb = (router.on as any).mock.calls[0][1];
        cb();
        cb();
    });
});

describe('NotificationsMenu', () => {
    it('vazio', async () => {
        render(<NotificationsMenu />);
        await userEvent
            .setup()
            .click(screen.getByRole('button', { name: 'Notificações' }));
        expect(screen.getByText(/em dia/i)).toBeInTheDocument();
    });
    it('com notificações', async () => {
        setPage({
            notificacoes_nao_lidas: 12,
            notificacoes_recentes: [
                {
                    id: 1,
                    titulo: 'Nova doação',
                    mensagem: 'msg',
                    url: '/x',
                    criado_em: new Date().toISOString(),
                },
            ],
        });
        render(<NotificationsMenu />);
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: /12 não lidas/ }));
        expect(screen.getByText('9+')).toBeInTheDocument();
        await u.click(screen.getByText(/marcar todas/i));
        expect(router.post).toHaveBeenCalled();
        await u.click(screen.getByLabelText(/Marcar "Nova doação"/));
        expect(router.patch).toHaveBeenCalled();
    });
    it('singular', () => {
        setPage({ notificacoes_nao_lidas: 1 });
        render(<NotificationsMenu />);
        expect(
            screen.getByRole('button', { name: /1 não lida$/ }),
        ).toBeInTheDocument();
    });
});

describe('Sidebar / Topbar / Header', () => {
    it.each(['doador', 'instituicao', 'admin'])(
        'AppSidebar %s',
        async (tipo) => {
            setPage(
                {
                    auth: { user: { ...user(), tipo_usuario: tipo } },
                    notificacoes_nao_lidas: 2,
                },
                '/instituicoes',
            );
            render(wrap(<AppSidebar />));
            await userEvent.setup().click(
                screen.getByRole('button', {
                    name: /soltar menu|manter menu/i,
                }),
            );
            expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
        },
    );
    it.each([
        ['doador', user()],
        ['instituicao', instUser()],
    ])('AppTopbar %s', async (_n, usr) => {
        setPage({ auth: { user: usr } }, '/x');
        render(wrap(<AppTopbar />));
        await userEvent.setup().click(screen.getByLabelText('Menu da conta'));
        await userEvent.setup().click(await screen.findByText('Sair'));
        expect(router.flushAll).toHaveBeenCalled();
    });
    it('AppTopbar sem nome usa email', () => {
        setPage({ auth: { user: user({ doador: undefined }) } });
        render(wrap(<AppTopbar />));
    });
    it.each([
        ['doador', user()],
        ['instituicao', instUser()],
    ])('AppHeader %s', async (_n, usr) => {
        setPage({ auth: { user: usr } }, '/instituicao/painel');
        render(
            wrap(
                <AppHeader
                    breadcrumbs={[
                        { title: 'a', href: '/a' },
                        { title: 'b', href: '/b' },
                    ]}
                />,
            ),
        );
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: '' }));
    });
    it('AppHeader sem breadcrumbs', () => {
        setPage({ auth: { user: user() } });
        render(wrap(<AppHeader />));
    });
});
