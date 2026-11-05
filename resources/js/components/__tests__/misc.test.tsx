import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FotoPerfilUploader } from '@/components/foto-perfil-uploader';
import { HorariosPublicosCard } from '@/components/instituicao/HorariosPublicosCard';
import { ImpactoResumo } from '@/components/instituicao/ImpactoResumo';
import { InstituicaoLogo } from '@/components/instituicao/InstituicaoLogo';
import { PerfilLogoEditavel } from '@/components/instituicao/PerfilLogoEditavel';
import { ItensDialog } from '@/components/itens-dialog';
import MapEmbed from '@/components/map-embed';
import { ScrollRow } from '@/components/scroll-row';
import { router } from '@/tests/inertia-mock';

describe('FotoPerfilUploader', () => {
    it('valida arquivo e envia', async () => {
        URL.createObjectURL = vi.fn(() => 'blob:x');
        URL.revokeObjectURL = vi.fn();
        const { container } = render(
            <FotoPerfilUploader nome="Ana Souza" fotoAtual="a.png" />,
        );
        const input = container.querySelector(
            'input[type=file]',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [] } });
        fireEvent.change(input, {
            target: {
                files: [new File(['x'], 'a.gif', { type: 'image/gif' })],
            },
        });
        expect(screen.getByText(/Formato inválido/)).toBeInTheDocument();
        const big = new File(['x'], 'b.png', { type: 'image/png' });
        Object.defineProperty(big, 'size', { value: 3 * 1024 * 1024 });
        fireEvent.change(input, { target: { files: [big] } });
        expect(screen.getByText(/máximo 2 MB/)).toBeInTheDocument();
        await userEvent.setup().click(screen.getByText('Trocar foto'));
        fireEvent.change(input, {
            target: {
                files: [new File(['x'], 'c.png', { type: 'image/png' })],
            },
        });
        expect(router.post).toHaveBeenCalled();
        const opts = (router.post as any).mock.calls[0][2];
        act(() => opts.onError({ foto: 'erro srv' }));
        expect(screen.getByText('erro srv')).toBeInTheDocument();
        act(() => opts.onError({}));
        act(() => opts.onFinish());
        await userEvent.setup().click(screen.getByText('Remover'));
        expect(router.delete).toHaveBeenCalled();
        await userEvent.setup().click(screen.getByText('Trocar foto'));
    });
    it('logo sem foto', () => {
        render(
            <FotoPerfilUploader nome="Casa" fotoAtual={null} variante="logo" />,
        );
        expect(screen.getByText('Enviar logo')).toBeInTheDocument();
        expect(screen.queryByText('Remover')).toBeNull();
    });
});

describe('instituicao', () => {
    it('HorariosPublicosCard', () => {
        const { rerender } = render(<HorariosPublicosCard horarios={[]} />);
        expect(screen.getByText(/ainda não cadastrou/)).toBeInTheDocument();
        rerender(
            <HorariosPublicosCard
                horarios={[
                    {
                        id: 1,
                        dia_semana: 1,
                        hora_inicio: '09:00:00',
                        hora_fim: '12:00:00',
                        tipo: 'entrega',
                    },
                    {
                        id: 2,
                        dia_semana: 1,
                        hora_inicio: '14:00:00',
                        hora_fim: '16:00:00',
                        tipo: 'coleta',
                    },
                ]}
            />,
        );
        expect(screen.getByText('Segunda-feira')).toBeInTheDocument();
        expect(screen.getByText(/Entrega: você leva/)).toBeInTheDocument();
    });
    it('ImpactoResumo', () => {
        const { rerender } = render(
            <ImpactoResumo
                impacto={{
                    doacoes_entregues: 0,
                    itens_recebidos: 0,
                    doadores: 0,
                }}
            />,
        );
        expect(screen.getByText(/ainda não recebeu/)).toBeInTheDocument();
        rerender(
            <ImpactoResumo
                isOwnProfile
                impacto={{
                    doacoes_entregues: 0,
                    itens_recebidos: 0,
                    doadores: 0,
                }}
            />,
        );
        expect(screen.getByText(/sua instituição/)).toBeInTheDocument();
        rerender(
            <ImpactoResumo
                impacto={{
                    doacoes_entregues: 1,
                    itens_recebidos: 1,
                    doadores: 1,
                }}
            />,
        );
        expect(screen.getByText('item recebido')).toBeInTheDocument();
        rerender(
            <ImpactoResumo
                impacto={{
                    doacoes_entregues: 1500,
                    itens_recebidos: 20,
                    doadores: 3,
                }}
            />,
        );
        expect(screen.getByText('doadores contribuíram')).toBeInTheDocument();
    });
    it('InstituicaoLogo', () => {
        const { rerender } = render(
            <InstituicaoLogo foto={null} nome="Casa" />,
        );
        rerender(
            <InstituicaoLogo
                foto="l.png"
                nome="Casa"
                tamanho="lg"
                className="x"
            />,
        );
        fireEvent.error(screen.getByAltText('Logo de Casa'));
        expect(screen.queryByAltText('Logo de Casa')).toBeNull();
    });
    it('PerfilLogoEditavel', async () => {
        render(<PerfilLogoEditavel foto={null} nome="Casa" />);
        await userEvent.setup().click(screen.getByLabelText('Enviar logo'));
        expect(
            await screen.findByText('Logo da instituição'),
        ).toBeInTheDocument();
        render(<PerfilLogoEditavel foto="a.png" nome="Casa" />);
        expect(screen.getByLabelText('Trocar logo')).toBeInTheDocument();
    });
});

describe('ItensDialog', () => {
    it('lista e vazio', async () => {
        render(
            <ItensDialog
                label="Ver"
                title="T"
                description="D"
                footer={<p>rodape</p>}
                grupos={[
                    {
                        titulo: 'G1',
                        vazio: 'nada',
                        itens: [{ categoria: 'Arroz', quantidade: 2 }],
                    },
                    { vazio: 'sem itens', itens: [] },
                ]}
            />,
        );
        await userEvent.setup().click(screen.getByText('Ver'));
        expect(screen.getByText('Arroz')).toBeInTheDocument();
        expect(screen.getByText('sem itens')).toBeInTheDocument();
        expect(screen.getByText('rodape')).toBeInTheDocument();
    });
});

describe('ScrollRow', () => {
    it('mostra botões quando há overflow', async () => {
        const defs: [string, number][] = [
            ['scrollWidth', 1000],
            ['clientWidth', 200],
            ['scrollLeft', 100],
        ];
        const spies = defs.map(([k, v]) =>
            vi.spyOn(HTMLElement.prototype, k as any, 'get').mockReturnValue(v),
        );
        HTMLElement.prototype.scrollBy = vi.fn();
        const { container } = render(
            <ScrollRow>
                <div>a</div>
            </ScrollRow>,
        );
        const u = userEvent.setup();
        await u.click(await screen.findByLabelText('Rolar para a direita'));
        await u.click(screen.getByLabelText('Rolar para a esquerda'));
        expect(HTMLElement.prototype.scrollBy).toHaveBeenCalledTimes(2);
        fireEvent.scroll(container.querySelector('.snap-x')!);
        spies.forEach((s) => s.mockRestore());
    });
    it('sem overflow', () => {
        render(
            <ScrollRow>
                <div>a</div>
            </ScrollRow>,
        );
        expect(screen.queryByLabelText('Rolar para a direita')).toBeNull();
    });
});

describe('MapEmbed', () => {
    it('sem WebGL mostra aviso', () => {
        render(<MapEmbed lat={1} lng={2} label="Rua" />);
        expect(
            screen.getByText(/Não foi possível carregar o mapa/),
        ).toBeInTheDocument();
    });
    it('com WebGL monta o mapa e reage ao tema', async () => {
        const orig = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({})) as any;
        const { unmount } = render(<MapEmbed lat={1} lng={2} label="Rua" />);
        expect(
            screen.getByRole('region', { name: 'Mapa: Rua' }),
        ).toBeInTheDocument();
        await act(async () => {
            document.documentElement.classList.add('dark');
            await Promise.resolve();
        });
        document.documentElement.classList.remove('dark');
        unmount();
        HTMLCanvasElement.prototype.getContext = orig;
    });
    it('erro ao criar o mapa é tolerado', async () => {
        const mod: any = await import('maplibre-gl');
        mod.MapLibreMap.mockImplementationOnce(() => {
            throw new Error('x');
        });
        const orig = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({})) as any;
        render(<MapEmbed lat={1} lng={2} label="Rua" />);
        HTMLCanvasElement.prototype.getContext = orig;
    });
});
