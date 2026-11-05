import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Transparencia from '@/pages/transparencia';
import Welcome from '@/pages/welcome';
import { user } from '@/tests/factories';
import { pick } from '@/tests/helpers';
import { router, setPage } from '@/tests/inertia-mock';
import { act, render, screen } from '@/tests/render';

describe('Welcome', () => {
    it('visitante com contadores animados', async () => {
        const raf = vi
            .spyOn(window, 'requestAnimationFrame')
            .mockImplementation((cb: any) => {
                setTimeout(() => cb(performance.now() + 5000), 0);

                return 1;
            });
        (globalThis as any).IntersectionObserver = class {
            constructor(private cb: any) {}
            observe() {
                this.cb([{ isIntersecting: true }]);
            }
            disconnect() {}
            unobserve() {}
        };
        setPage({ auth: { user: null } });
        render(<Welcome />);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        expect(screen.getAllByText('Entrar').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Cadastrar').length).toBeGreaterThan(0);
        raf.mockRestore();
    });
    it('sem cadastro, com stats zeradas', () => {
        setPage({ auth: { user: null } });
        render(
            <Welcome
                canRegister={false}
                stats={{ doadoras: 0, instituicoes: 0, doacoes: 0 }}
            />,
        );
        expect(screen.queryByText('Cadastrar')).toBeNull();
    });
    it('usuário logado', () => {
        setPage({ auth: { user: user() } });
        render(<Welcome />);
        expect(screen.getAllByText('Ir para o painel').length).toBeGreaterThan(
            0,
        );
    });
});

describe('Transparencia', () => {
    const doacao = (id: number, o: any = {}) => ({
        id,
        data_entrega: '2026-03-04',
        instituicao: 'Casa',
        doador: 'Ana',
        itens: [
            { categoria: 'Alimentos', descricao: 'arroz', quantidade: 3 },
            { categoria: null, descricao: null, quantidade: 1 },
        ],
        ...o,
    });
    const pag = (data: any[], over: any = {}) => ({
        data,
        links: [
            { url: null, label: '&laquo; Anterior', active: false },
            { url: '/t?page=1', label: '1', active: true },
            { url: '/t?page=2', label: '2', active: false },
            { url: null, label: 'Próxima &raquo;', active: false },
        ],
        current_page: 1,
        last_page: 2,
        total: data.length,
        ...over,
    });
    it('lista e filtra', async () => {
        setPage({ auth: { user: null } });
        render(
            <Transparencia
                doacoes={
                    pag([
                        doacao(1),
                        doacao(2, {
                            data_entrega: null,
                            instituicao: null,
                            doador: null,
                        }),
                    ]) as any
                }
                filtros={{}}
                instituicoes={[{ usuario_id: 5, nome_fantasia: 'Casa' }]}
                total={2}
            />,
        );
        const u = userEvent.setup();
        expect(screen.getByText('Doado por Ana')).toBeInTheDocument();
        expect(screen.getByText('Doador anônimo')).toBeInTheDocument();
        await pick(u, screen.getByRole('combobox'), 'Casa');
        await u.type(screen.getByLabelText('De'), '2026-01-01');
        await u.type(screen.getByLabelText('Até'), '2026-02-01');
        await u.click(screen.getByRole('button', { name: /Filtrar/ }));
        expect((router.get as any).mock.calls[0][1]).toMatchObject({
            instituicao: '5',
            de: '2026-01-01',
            ate: '2026-02-01',
        });
        await u.click(screen.getByLabelText('Limpar filtros'));
        expect((router.get as any).mock.calls[1][1]).toEqual({});
    });
    it('vazio, 1 doação, logado e filtros iniciais', () => {
        setPage({ auth: { user: user() } });
        render(
            <Transparencia
                doacoes={pag([], { last_page: 1, links: [] }) as any}
                filtros={{ instituicao: 5, de: '2026-01-01' }}
                instituicoes={[]}
                total={1}
            />,
        );
        expect(
            screen.getByText(/Nenhuma doação encontrada/),
        ).toBeInTheDocument();
        expect(
            screen.getByText('doação entregue', { exact: false }),
        ).toBeInTheDocument();
    });
});
