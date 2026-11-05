import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ErrorPage from '@/pages/error';
import Necessidades from '@/pages/instituicao/necessidades';
import Notificacoes from '@/pages/notificacoes';
import { instUser, user } from '@/tests/factories';
import { router, setPage } from '@/tests/inertia-mock';
import { render, screen } from '@/tests/render';

describe('Error page', () => {
    it.each([403, 404, 500, 503, 419, 418])('status %s', (s) => {
        render(<ErrorPage status={s} />);
        expect(screen.getByText(String(s))).toBeInTheDocument();
    });
    it('voltar', async () => {
        const back = vi
            .spyOn(window.history, 'back')
            .mockImplementation(() => {});
        render(<ErrorPage status={404} />);
        await userEvent.setup().click(screen.getByText('Página anterior'));
        expect(back).toHaveBeenCalled();
    });
});

describe('Notificacoes', () => {
    const n = (id: number, lida: boolean) => ({
        id,
        titulo: 'T' + id,
        mensagem: 'm',
        url: null,
        lida,
        criado_em: new Date().toISOString(),
    });
    it('lista e marca como lida', async () => {
        setPage({ auth: { user: user() } });
        render(<Notificacoes notificacoes={[n(1, false), n(2, true)]} />);
        const u = userEvent.setup();
        await u.click(screen.getByText(/Marcar todas/));
        expect(router.post).toHaveBeenCalled();
        await u.click(screen.getByLabelText('Marcar "T1" como lida'));
        expect(router.patch).toHaveBeenCalled();
    });
    it('vazio', () => {
        setPage({ auth: { user: user() } });
        render(<Notificacoes notificacoes={[]} />);
        expect(
            screen.getByText('Nenhuma notificação ainda.'),
        ).toBeInTheDocument();
    });
});

describe('instituicao/Necessidades', () => {
    const cats = [{ id: 1, nome: 'Alimentos' }];
    const nec = {
        id: 1,
        descricao: 'Cestas básicas',
        prioridade: 'alta',
        quantidade_atual: 1,
        quantidade_objetivo: 5,
        categoria_id: 1,
        categoria: { id: 1, nome: 'Alimentos' },
    };
    it('cria e edita', async () => {
        setPage({ auth: { user: instUser() } });
        render(
            <Necessidades
                categorias={cats}
                necessidades={[nec]}
                necessidades_count={1}
                tem_horarios
                horarios={[]}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('Editar'));
        expect(
            await screen.findByText('Editar necessidade'),
        ).toBeInTheDocument();
        await u.keyboard('{Escape}');
        await u.click(screen.getByText('Nova necessidade'));
        expect(
            await screen.findByText('Criar necessidade'),
        ).toBeInTheDocument();
    });
    it('sem horários / vazio', () => {
        setPage({ auth: { user: instUser() } });
        render(
            <Necessidades
                categorias={cats}
                necessidades={[]}
                necessidades_count={0}
                tem_horarios={false}
                horarios={[]}
            />,
        );
        expect(
            screen.getByText(/Adicione ao menos um horário/),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Nenhuma necessidade cadastrada ainda.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Nova necessidade')).toBeDisabled();
    });
});
