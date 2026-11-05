import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InstituicoesIndex from '@/pages/instituicoes/index';
import { user } from '@/tests/factories';
import { pick } from '@/tests/helpers';
import { router, setPage } from '@/tests/inertia-mock';
import { act, render, screen } from '@/tests/render';

afterEach(() => vi.useRealTimers());

const causas = [
    { id: 1, nome: 'Crianças', icone: 'paw' },
    { id: 2, nome: 'Idosos', icone: null },
];
const cats = [{ id: 1, nome: 'Alimentos' }];
const inst = (id: number, o: any = {}) => ({
    usuario_id: id,
    nome_fantasia: 'Inst' + id,
    foto_perfil: null,
    endereco_completo: 'Rua ' + id,
    verificada: true,
    causas,
    necessidades_ativas_count: 3,
    distancia_km: 2,
    ...o,
});
const rec = (id: number, o: any = {}) => ({
    usuario_id: id,
    nome_fantasia: 'Rec' + id,
    foto_perfil: null,
    endereco_completo: 'Rua R',
    causas: [
        ...causas,
        { id: 3, nome: 'A', icone: null },
        { id: 4, nome: 'B', icone: null },
    ],
    causa_overlap: 1,
    distancia_km: 0.5,
    ...o,
});
const filters = (o: any = {}) => ({
    search: '',
    causa: null,
    categoria: null,
    raio: null,
    ...o,
});
const pag = (data: any[], o: any = {}) => ({
    data,
    current_page: 1,
    next_page_url: null,
    prev_page_url: null,
    ...o,
});

const base = { causas, categorias: cats, hasLocation: true };

describe('InstituicoesIndex', () => {
    it('lista, recomendações e filtros', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        setPage({ auth: { user: user() } }, '/instituicoes');
        render(
            <InstituicoesIndex
                {...base}
                instituicoes={
                    pag(
                        [
                            inst(1),
                            inst(2, {
                                distancia_km: null,
                                endereco_completo: '',
                                causas: [],
                                verificada: false,
                            }),
                        ],
                        { next_page_url: '/n' },
                    ) as any
                }
                filters={filters()}
                recomendacoes={
                    [
                        rec(10),
                        rec(11, { causa_overlap: 2, distancia_km: null }),
                    ] as any
                }
            />,
        );
        const u = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        expect(screen.getByText('Rec10')).toBeInTheDocument();
        await u.click(screen.getByText(/Recomendadas para você/));
        expect(screen.queryByText('Rec10')).toBeNull();
        await u.click(screen.getByText(/Recomendadas para você/));
        await u.click(screen.getByRole('button', { name: 'Crianças' }));
        expect((router.get as any).mock.calls.at(-1)[1]).toMatchObject({
            causa: '1',
        });
        await u.click(screen.getByRole('button', { name: 'Todas' }));
        await u.type(screen.getByPlaceholderText(/Buscar por nome/), 'casa');
        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect((router.get as any).mock.calls.at(-1)[1]).toMatchObject({
            search: 'casa',
        });
        await u.click(screen.getByLabelText('Limpar busca'));
        act(() => {
            vi.advanceTimersByTime(400);
        });
        act(() => {
            vi.advanceTimersByTime(300);
        });
        const opts = (router.get as any).mock.calls.at(-1)[2];
        act(() => {
            opts.onSuccess();
            opts.onError();
        });
    });

    it('filtros de item e raio', async () => {
        setPage({ auth: { user: user() } });
        render(
            <InstituicoesIndex
                {...base}
                instituicoes={pag([inst(1)]) as any}
                filters={filters({ categoria: 1, raio: 10 })}
                recomendacoes={[]}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByLabelText('Filtros'));
        const [catSel, raioSel] = await screen.findAllByRole('combobox');
        await pick(u, catSel, 'Qualquer item');
        await pick(u, raioSel, 'até 25 km');
        await u.click(screen.getByText('Limpar filtros'));
        expect((router.get as any).mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('filtros sem localização', async () => {
        setPage({ auth: { user: user() } });
        render(
            <InstituicoesIndex
                {...base}
                hasLocation={false}
                instituicoes={pag([inst(1)]) as any}
                filters={filters({ causa: 2 })}
                recomendacoes={[rec(1)] as any}
            />,
        );
        await userEvent.setup().click(screen.getByLabelText('Filtros'));
        expect(await screen.findByText(/Cadastre seu/)).toBeInTheDocument();
        await userEvent.setup().keyboard('{Escape}');
        await userEvent
            .setup()
            .click(screen.getByRole('button', { name: 'Idosos' }));
    });

    it('sem recomendações com lista', () => {
        setPage({ auth: { user: user() } });
        render(
            <InstituicoesIndex
                {...base}
                instituicoes={pag([inst(1)], { prev_page_url: '/p' }) as any}
                filters={filters()}
                recomendacoes={[]}
            />,
        );
        expect(
            screen.getByText(/Nenhuma recomendação disponível/),
        ).toBeInTheDocument();
    });

    it('vazio com e sem busca', async () => {
        setPage({ auth: { user: user() } });
        const { unmount } = render(
            <InstituicoesIndex
                {...base}
                causas={[]}
                instituicoes={pag([]) as any}
                filters={filters()}
                recomendacoes={[]}
            />,
        );
        expect(
            screen.getByText('Nenhuma instituição cadastrada'),
        ).toBeInTheDocument();
        unmount();
        render(
            <InstituicoesIndex
                {...base}
                instituicoes={pag([]) as any}
                filters={filters({ search: 'xyz', causa: 1 })}
                recomendacoes={[]}
            />,
        );
        expect(
            screen.getByText('Nenhuma instituição encontrada'),
        ).toBeInTheDocument();
        await userEvent.setup().click(screen.getByText('Limpar busca'));
        expect((router.get as any).mock.calls.at(-1)[1]).toEqual({});
    });

    it('mostra skeleton enquanto busca e sincroniza filtro externo', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        setPage({ auth: { user: user() } });
        const { rerender } = render(
            <InstituicoesIndex
                {...base}
                instituicoes={pag([inst(1)]) as any}
                filters={filters()}
                recomendacoes={[]}
            />,
        );
        const u = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        await u.click(screen.getByRole('button', { name: 'Idosos' }));
        act(() => {
            vi.advanceTimersByTime(250);
        });
        expect(
            document.querySelectorAll('[data-slot=skeleton]').length,
        ).toBeGreaterThan(5);
        rerender(
            <InstituicoesIndex
                {...base}
                instituicoes={pag([inst(1)]) as any}
                filters={filters({ search: 'novo' })}
                recomendacoes={[]}
            />,
        );
        expect(screen.getByPlaceholderText(/Buscar por nome/)).toHaveValue(
            'novo',
        );
    });
});
