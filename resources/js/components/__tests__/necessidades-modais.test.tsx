import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DoacaoNecessidadesModal } from '@/components/doacao/DoacaoNecessidadesModal';
import { TransferenciaNecessidadesModal } from '@/components/transferencia/TransferenciaNecessidadesModal';
import { pickNth } from '@/tests/helpers';
import { router } from '@/tests/inertia-mock';

const nec = (id: number, over: any = {}) => ({
    id,
    descricao: 'desc ' + id,
    quantidade_objetivo: 10,
    quantidade_atual: 2,
    prioridade: 'alta' as const,
    categoria: { id: id * 10, nome: 'Cat' + id },
    ...over,
});
const necessidades = [
    nec(1),
    nec(2, { prioridade: 'media', descricao: null }),
    nec(3, { prioridade: 'baixa' }),
    nec(4, { quantidade_atual: 10 }),
];
const horarios = [
    {
        id: 1,
        dia_semana: 1,
        hora_inicio: '09:00:00',
        hora_fim: '12:00:00',
        tipo: 'entrega' as const,
    },
    {
        id: 2,
        dia_semana: 4,
        hora_inicio: '14:00:00',
        hora_fim: '16:00:00',
        tipo: 'coleta' as const,
    },
];

describe('DoacaoNecessidadesModal', () => {
    it('seleciona, ajusta quantidade e envia', async () => {
        const onClose = vi.fn();
        render(
            <DoacaoNecessidadesModal
                open
                onClose={onClose}
                instituicaoId={3}
                necessidades={necessidades}
                horariosDisponiveis={horarios}
            />,
        );
        const u = userEvent.setup();
        expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled();
        await u.click(screen.getByText('Cat1'));
        const qty = screen.getByRole('spinbutton');
        await u.clear(qty);
        await u.type(qty, '99');
        expect(qty).toHaveValue(8);
        await u.clear(qty);
        await u.click(screen.getByText('Cat2'));
        await u.click(screen.getByText('Cat3'));
        await u.click(screen.getByText('Cat3'));
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await pickNth(u, screen.getAllByRole('combobox')[0]);
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await u.click(screen.getByRole('button', { name: 'Voltar' }));
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await u.click(
            screen.getByRole('button', { name: 'Enviar solicitação' }),
        );
        const [, payload, opts] = (router.post as any).mock.calls[0];
        expect(payload.itens.length).toBe(2);
        act(() => opts.onError());
        act(() => opts.onSuccess());
        expect(onClose).toHaveBeenCalled();
    });
    it('coleta com endereço, pré-seleção e sem horários', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
        } as Response);
        const { rerender } = render(
            <DoacaoNecessidadesModal
                open={false}
                onClose={() => {}}
                instituicaoId={3}
                necessidades={necessidades}
                horariosDisponiveis={horarios}
                initialNecessidadeId={2}
            />,
        );
        rerender(
            <DoacaoNecessidadesModal
                open
                onClose={() => {}}
                instituicaoId={3}
                necessidades={necessidades}
                horariosDisponiveis={horarios}
                initialNecessidadeId={2}
            />,
        );
        const u = userEvent.setup();
        expect(screen.getByRole('spinbutton')).toHaveValue(1);
        await pickNth(u, screen.getAllByRole('combobox')[0], 1);
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await pickNth(u, screen.getAllByRole('combobox')[0]);
        expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled();
        await u.type(screen.getByLabelText('CEP'), '01310100');
        await u.type(screen.getByLabelText('Logradouro'), 'Rua X');
        await u.type(screen.getByLabelText('Numero'), '5');
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        expect(screen.getByText(/Rua X/)).toBeInTheDocument();
    });
    it('todas atendidas / sem horário / Escape', async () => {
        const onClose = vi.fn();
        const { rerender } = render(
            <DoacaoNecessidadesModal
                open
                onClose={onClose}
                instituicaoId={3}
                necessidades={[nec(4, { quantidade_atual: 10 })]}
                horariosDisponiveis={[]}
            />,
        );
        expect(
            screen.getByText(/Todas as necessidades já foram atendidas/),
        ).toBeInTheDocument();
        rerender(
            <DoacaoNecessidadesModal
                open
                onClose={onClose}
                instituicaoId={3}
                necessidades={necessidades}
                horariosDisponiveis={[]}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('Cat1'));
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        expect(
            screen.getByText(/Nenhum horário disponível/),
        ).toBeInTheDocument();
        await u.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });
});

describe('TransferenciaNecessidadesModal', () => {
    const estoque = { 10: 5, 20: 0, 30: 50 };
    it('respeita estoque e envia', async () => {
        const onClose = vi.fn();
        render(
            <TransferenciaNecessidadesModal
                open
                onClose={onClose}
                instituicaoDestinoId={9}
                necessidades={necessidades}
                horariosDisponiveis={horarios}
                estoque={estoque}
            />,
        );
        const u = userEvent.setup();
        expect(screen.getByText('Sem estoque disponível')).toBeInTheDocument();
        await u.click(screen.getByText('Cat2').closest('button')!);
        await u.click(screen.getByText('Cat1'));
        const qty = screen.getByRole('spinbutton');
        await u.clear(qty);
        await u.type(qty, '99');
        expect(qty).toHaveValue(5);
        await u.click(screen.getByText('Cat3'));
        await u.click(screen.getByText('Cat3'));
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await pickNth(u, screen.getAllByRole('combobox')[1]);
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await u.click(screen.getByRole('button', { name: 'Voltar' }));
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await u.click(
            screen.getByRole('button', { name: 'Enviar transferência' }),
        );
        const [, payload, opts] = (router.post as any).mock.calls[0];
        expect(payload.instituicao_destino_id).toBe(9);
        act(() => opts.onError());
        act(() => opts.onSuccess());
        expect(onClose).toHaveBeenCalled();
    });
    it('coleta e voltar ao início, pré-seleção, vazio', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
        } as Response);
        render(
            <TransferenciaNecessidadesModal
                open
                onClose={() => {}}
                instituicaoDestinoId={9}
                necessidades={necessidades}
                horariosDisponiveis={horarios}
                estoque={estoque}
                initialNecessidadeId={1}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await pickNth(u, screen.getAllByRole('combobox')[0], 1);
        await pickNth(u, screen.getAllByRole('combobox')[1]);
        await u.type(screen.getByLabelText('CEP'), '01310100');
        await u.type(screen.getByLabelText('Logradouro'), 'Rua Y');
        await u.type(screen.getByLabelText('Numero'), '7');
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        await u.click(
            screen.getByRole('button', { name: 'Enviar transferência' }),
        );
        expect(
            (router.post as any).mock.calls[0][1].agendamento
                .endereco_referencia,
        ).toContain('Rua Y');
    });
    it('sem horários, sem necessidades abertas e Escape', async () => {
        const onClose = vi.fn();
        const { unmount } = render(
            <TransferenciaNecessidadesModal
                open
                onClose={() => {}}
                instituicaoDestinoId={9}
                necessidades={[nec(4, { quantidade_atual: 10 })]}
                horariosDisponiveis={[]}
            />,
        );
        expect(
            screen.getByText(/Todas as necessidades já foram atendidas/),
        ).toBeInTheDocument();
        unmount();
        render(
            <TransferenciaNecessidadesModal
                open
                onClose={onClose}
                instituicaoDestinoId={9}
                necessidades={necessidades}
                horariosDisponiveis={[]}
                estoque={estoque}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('Cat1'));
        await u.click(screen.getByRole('button', { name: 'Próximo' }));
        expect(screen.getByText(/horário/i)).toBeInTheDocument();
        await u.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });
});
