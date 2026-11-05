import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import MinhasDoacoes from '@/pages/doador/doacoes';
import { user } from '@/tests/factories';
import { router, setPage } from '@/tests/inertia-mock';
import { act, render, screen } from '@/tests/render';

const ag = (o: any = {}) => ({
    data_hora: '2026-12-10T10:00:00Z',
    tipo: 'coleta',
    endereco_referencia: 'Rua A, 1',
    status: 'confirmado',
    data_hora_sugerida: null,
    ...o,
});
const d = (id: number, status: string, o: any = {}) => ({
    id,
    status,
    instituicao: { id: id % 2 ? 1 : 2, nome_fantasia: 'Inst' + id },
    criado_em: '2026-11-01T00:00:00Z',
    itens: [
        { id: 1, categoria: 'Roupas', quantidade: 2, descricao: 'inverno' },
        { id: 2, categoria: 'Livros', quantidade: 1, descricao: null },
    ],
    agendamento: ag(),
    avaliacao: null,
    ...o,
});

describe('MinhasDoacoes', () => {
    it('lista todos os status, cancela e responde sugestão', async () => {
        setPage({ auth: { user: user() } });
        render(
            <MinhasDoacoes
                doacoes={
                    [
                        d(1, 'pendente'),
                        d(2, 'confirmada', {
                            agendamento: ag({
                                tipo: 'entrega',
                                status: 'alteracao_sugerida',
                                data_hora_sugerida: '2026-12-12T10:00:00Z',
                            }),
                        }),
                        d(3, 'entregue', {
                            avaliacao: { nota: 4, descricao: 'ótimo' },
                            agendamento: null,
                        }),
                        d(4, 'cancelado'),
                        d(5, 'recusada'),
                        d(6, 'nao_entregue', {
                            agendamento: ag({ endereco_referencia: null }),
                        }),
                        d(7, 'status-desconhecido'),
                    ] as any
                }
            />,
        );
        const u = userEvent.setup();
        expect(
            screen.getByText('Em andamento', { selector: 'h2' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Histórico')).toBeInTheDocument();
        expect(screen.getByText('Aguardando sua resposta')).toBeInTheDocument();
        await u.click(screen.getByRole('button', { name: 'Aceitar' }));
        act(() => (router.post as any).mock.calls[0][2].onFinish());
        await u.click(screen.getByRole('button', { name: 'Recusar' }));
        expect((router.post as any).mock.calls).toHaveLength(2);
        act(() => (router.post as any).mock.calls[1][2].onFinish());
        await u.click(
            screen.getAllByRole('button', { name: /Cancelar solicitação/ })[1],
        );
        expect(
            await screen.findByText(/já foi confirmada/),
        ).toBeInTheDocument();
        await u.click(
            screen.getByRole('button', { name: 'Confirmar cancelamento' }),
        );
        act(() => (router.post as any).mock.calls[2][2].onFinish());
        expect(screen.getByText('ótimo')).toBeInTheDocument();
    });
    it('cancela pendente e voltar', async () => {
        setPage({ auth: { user: user({ doador: undefined }) } });
        render(<MinhasDoacoes doacoes={[d(1, 'pendente')] as any} />);
        const u = userEvent.setup();
        await u.click(
            screen.getByRole('button', { name: /Cancelar solicitação/ }),
        );
        await u.click(await screen.findByRole('button', { name: 'Voltar' }));
        expect(screen.getByText('doação total')).toBeInTheDocument();
    });
    it('vazio', () => {
        setPage({ auth: { user: user() } });
        render(<MinhasDoacoes doacoes={[]} />);
        expect(screen.getByText('Nenhuma doação ainda')).toBeInTheDocument();
    });
});
