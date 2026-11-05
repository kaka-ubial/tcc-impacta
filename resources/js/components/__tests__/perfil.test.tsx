import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PerfilCausasDialog } from '@/components/instituicao/PerfilCausasDialog';
import { PerfilSobreCard } from '@/components/instituicao/PerfilSobreCard';
import { formBehavior, formCalls } from '@/tests/inertia-mock';

describe('PerfilSobreCard', () => {
    it('sem descrição, edita e salva', async () => {
        render(<PerfilSobreCard descricao={null} />);
        const u = userEvent.setup();
        expect(screen.getByText(/ainda não escreveu/)).toBeInTheDocument();
        await u.click(screen.getByRole('button', { name: /Editar/ }));
        await u.type(screen.getByLabelText('Descrição da instituição'), 'Nova');
        await u.click(screen.getByRole('button', { name: 'Salvar' }));
        expect(formCalls.at(-1)!.method).toBe('patch');
        expect(screen.queryByLabelText('Descrição da instituição')).toBeNull();
    });
    it('com descrição, cancela e mostra erro', async () => {
        render(<PerfilSobreCard descricao="Texto atual" />);
        const u = userEvent.setup();
        expect(screen.getByText('Texto atual')).toBeInTheDocument();
        await u.click(screen.getByRole('button', { name: /Editar/ }));
        await u.click(screen.getByRole('button', { name: 'Cancelar' }));
        expect(screen.getByText('Texto atual')).toBeInTheDocument();
        formBehavior.mode = 'error';
        formBehavior.errors = { descricao: 'longa demais' };
        await u.click(screen.getByRole('button', { name: /Editar/ }));
        await u.click(screen.getByRole('button', { name: 'Salvar' }));
        expect(await screen.findByText('longa demais')).toBeInTheDocument();
    });
});

describe('PerfilCausasDialog', () => {
    const causas = [
        { id: 1, nome: 'Crianças', icone: null },
        { id: 2, nome: 'Idosos', icone: null },
    ];
    it('alterna e salva', async () => {
        const onClose = vi.fn();
        render(
            <PerfilCausasDialog
                open
                onClose={onClose}
                todasCausas={causas}
                selecionadas={[1]}
            />,
        );
        const u = userEvent.setup();
        expect(
            screen.getByRole('button', { name: 'Crianças' }),
        ).toHaveAttribute('aria-pressed', 'true');
        await u.click(screen.getByRole('button', { name: 'Crianças' }));
        await u.click(screen.getByRole('button', { name: 'Idosos' }));
        await u.click(screen.getByRole('button', { name: 'Salvar causas' }));
        expect(onClose).toHaveBeenCalled();
    });
    it('cancela e erro', async () => {
        const onClose = vi.fn();
        formBehavior.mode = 'error';
        formBehavior.errors = { causas: 'obrigatório' };
        render(
            <PerfilCausasDialog
                open
                onClose={onClose}
                todasCausas={causas}
                selecionadas={[]}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: 'Salvar causas' }));
        expect(await screen.findByText('obrigatório')).toBeInTheDocument();
        await u.click(screen.getByRole('button', { name: 'Cancelar' }));
        expect(onClose).toHaveBeenCalled();
    });
});
