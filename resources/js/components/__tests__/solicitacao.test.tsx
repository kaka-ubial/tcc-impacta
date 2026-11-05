import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SolicitacaoDoacaoModal } from '@/components/doacao/SolicitacaoDoacaoModal';
import { pick, pickNth } from '@/tests/helpers';
import { router, setPage } from '@/tests/inertia-mock';

afterEach(() => vi.useRealTimers());

const cats = [
    { id: 1, nome: 'Alimentos' },
    { id: 2, nome: 'Roupas' },
];
const horarios = [
    {
        id: 10,
        dia_semana: 1,
        hora_inicio: '09:00:00',
        hora_fim: '12:00:00',
        tipo: 'entrega' as const,
    },
    {
        id: 11,
        dia_semana: 3,
        hora_inicio: '14:00:00',
        hora_fim: '16:00:00',
        tipo: 'coleta' as const,
    },
];

describe('SolicitacaoDoacaoModal', () => {
    it('fluxo de entrega completo', async () => {
        const onClose = vi.fn();
        render(
            <SolicitacaoDoacaoModal
                open
                onClose={onClose}
                instituicaoId={5}
                categorias={cats}
                horariosDisponiveis={horarios}
            />,
        );
        const u = userEvent.setup();
        const next = () => screen.getByRole('button', { name: 'Próximo' });
        expect(next()).toBeDisabled();
        const combos = screen.getAllByRole('combobox');
        await pick(u, combos[1], 'Alimentos');
        await u.click(screen.getByRole('button', { name: /Adicionar item/ }));
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        await u.click(
            screen
                .getAllByRole('button')
                .filter((b) => b.querySelector('svg[class*="lucide-trash"]'))
                .at(-1)!,
        );
        await u.clear(screen.getAllByRole('spinbutton')[0]);
        await u.type(screen.getAllByRole('spinbutton')[0], '3');
        await u.type(
            screen.getAllByPlaceholderText(/roupas de inverno/)[0],
            'camisas',
        );
        await u.click(next());
        await pickNth(u, screen.getAllByRole('combobox')[0]);
        await u.click(next());
        await u.click(screen.getByRole('button', { name: 'Voltar' }));
        await u.click(next());
        await u.click(
            screen.getByRole('button', { name: 'Enviar solicitação' }),
        );
        const [, payload, opts] = (router.post as any).mock.calls[0];
        expect(payload.itens[0]).toMatchObject({
            categoria_id: 1,
            quantidade: 3,
            descricao: 'camisas',
        });
        expect(payload.agendamento.tipo).toBe('entrega');
        act(() => opts.onError());
        await u.click(screen.getByRole('button', { name: 'Voltar' }));
        await u.click(screen.getByRole('button', { name: 'Voltar' }));
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await u.click(
            screen.getByRole('button', { name: 'Enviar solicitação' }),
        );
        act(() => (router.post as any).mock.calls[1][2].onSuccess());
        expect(onClose).toHaveBeenCalled();
    });

    it('coleta exige endereço', async () => {
        setPage({ errors: { 'agendamento.data_hora': 'data ruim' } });
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
        } as Response);
        render(
            <SolicitacaoDoacaoModal
                open
                onClose={() => {}}
                instituicaoId={5}
                categorias={cats}
                horariosDisponiveis={horarios}
            />,
        );
        const u = userEvent.setup();
        await pick(u, screen.getAllByRole('combobox')[0], /Coleta/);
        await pick(u, screen.getAllByRole('combobox')[1], 'Roupas');
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        expect(screen.getByText('data ruim')).toBeInTheDocument();
        await pickNth(u, screen.getAllByRole('combobox')[0]);
        expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled();
        await u.type(screen.getByLabelText('CEP'), '01310100');
        await u.type(screen.getByLabelText('Logradouro'), 'Av Paulista');
        await u.type(screen.getByLabelText('Numero'), '10');
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        expect(screen.getByText(/Av Paulista/)).toBeInTheDocument();
        await u.click(
            screen.getByRole('button', { name: 'Enviar solicitação' }),
        );
        expect(
            (router.post as any).mock.calls[0][1].agendamento
                .endereco_referencia,
        ).toContain('Av Paulista');
    });

    it('sem horários e fecha com Escape', async () => {
        const onClose = vi.fn();
        render(
            <SolicitacaoDoacaoModal
                open
                onClose={onClose}
                instituicaoId={5}
                categorias={cats}
                horariosDisponiveis={[]}
            />,
        );
        const u = userEvent.setup();
        await pick(u, screen.getAllByRole('combobox')[1], 'Alimentos');
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        expect(
            screen.getByText(/não possui horários disponíveis/),
        ).toBeInTheDocument();
        await u.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });
});
