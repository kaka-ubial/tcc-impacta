import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NecessidadeCard } from '@/components/necessidade-card';
import { NecessidadeCreateModal } from '@/components/necessidade-modal';
import { pick } from '@/tests/helpers';
import { formBehavior, formCalls, router } from '@/tests/inertia-mock';

const base = {
    id: 7,
    descricao: 'Cestas',
    prioridade: 'alta' as const,
    quantidade_atual: 2,
    quantidade_objetivo: 10,
    categoria: { nome: 'Alimentos' },
    instituicao: { nome_fantasia: 'Casa' },
};

describe('NecessidadeCard', () => {
    it('doador', () => {
        render(<NecessidadeCard necessidade={base} />);
        expect(screen.getByText('20% atendido')).toBeInTheDocument();
        expect(screen.getByText('Casa')).toBeInTheDocument();
        expect(screen.getByText('Quero doar')).toBeInTheDocument();
        expect(screen.getByText('Ativa')).toBeInTheDocument();
    });
    it.each([
        ['media', 'Média prioridade'],
        ['baixa', 'Baixa prioridade'],
    ])('prioridade %s', (p, label) => {
        render(
            <NecessidadeCard
                necessidade={{
                    ...base,
                    prioridade: p as any,
                    quantidade_atual: 10,
                    descricao: undefined,
                    instituicao: undefined,
                }}
            />,
        );
        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText('Concluída')).toBeInTheDocument();
    });
    it('instituição edita e exclui', async () => {
        const onEdit = vi.fn();
        render(
            <NecessidadeCard
                necessidade={base}
                variant="instituicao"
                onEdit={onEdit}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('Editar'));
        expect(onEdit).toHaveBeenCalled();
        await u.click(screen.getByText('Deletar'));
        await u.click(await screen.findByText('Excluir'));
        expect(router.delete).toHaveBeenCalledWith(
            '/instituicao/necessidades/7',
            expect.anything(),
        );
        const opts = (router.delete as any).mock.calls[0][1];
        opts.onFinish();
    });
    it('instituição sem descrição', async () => {
        render(
            <NecessidadeCard
                necessidade={{ ...base, descricao: undefined }}
                variant="instituicao"
            />,
        );
        await userEvent.setup().click(screen.getByText('Deletar'));
        await userEvent.setup().click(await screen.findByText('Cancelar'));
    });
});

describe('NecessidadeCreateModal', () => {
    const cats = [
        { id: 1, nome: 'Alimentos' },
        { id: 2, nome: 'Roupas' },
    ];
    it('cria', async () => {
        const setOpen = vi.fn();
        render(
            <NecessidadeCreateModal categorias={cats} open setOpen={setOpen} />,
        );
        const u = userEvent.setup();
        expect(screen.getByText('Criar necessidade')).toBeInTheDocument();
        const submit = screen.getByRole('button', { name: 'Criar' });
        expect(submit).toBeDisabled();
        const [catTrigger, prioTrigger] = screen.getAllByRole('combobox');
        await pick(u, catTrigger, 'Roupas');
        await u.type(screen.getByPlaceholderText(/Descreva/), 'abc');
        expect(screen.getByText(/pelo menos 5/)).toBeInTheDocument();
        await u.type(screen.getByPlaceholderText(/Descreva/), 'defg');
        await u.type(screen.getByPlaceholderText('Ex: 100'), '10');
        await u.clear(screen.getByPlaceholderText('Ex: 100'));
        await u.type(screen.getByPlaceholderText('Ex: 100'), '12');
        await pick(u, prioTrigger, 'Alta');
        await u.click(submit);
        expect(formCalls.at(-1)).toMatchObject({ method: 'post' });
        expect(formCalls.at(-1)!.args[0]).toBe('/instituicao/necessidades');
        expect(setOpen).toHaveBeenCalledWith(false);
        await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    });
    it('edita e mostra erros', async () => {
        formBehavior.mode = 'error';
        formBehavior.errors = {
            categoria_id: 'e1',
            descricao: 'e2',
            quantidade_objetivo: 'e3',
        };
        const setOpen = vi.fn();
        render(
            <NecessidadeCreateModal
                categorias={cats}
                open
                setOpen={setOpen}
                initialData={{
                    id: 9,
                    categoria_id: 1,
                    descricao: 'descricao ok',
                    quantidade_objetivo: 5,
                    prioridade: 'baixa',
                }}
            />,
        );
        const u = userEvent.setup();
        expect(screen.getByText('Editar necessidade')).toBeInTheDocument();
        await u.click(screen.getByRole('button', { name: 'Editar' }));
        expect(formCalls.at(-1)).toMatchObject({ method: 'put' });

        for (const e of ['e1', 'e2', 'e3']) {
            expect(await screen.findByText(e)).toBeInTheDocument();
        }
    });
    it('edita com sucesso', async () => {
        const setOpen = vi.fn();
        render(
            <NecessidadeCreateModal
                categorias={cats}
                open
                setOpen={setOpen}
                initialData={{
                    id: 9,
                    categoria_id: 1,
                    descricao: 'descricao ok',
                    quantidade_objetivo: 5,
                }}
            />,
        );
        await userEvent
            .setup()
            .click(screen.getByRole('button', { name: 'Editar' }));
        expect(setOpen).toHaveBeenCalledWith(false);
    });
});
