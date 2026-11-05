import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DeleteUser from '@/components/delete-user';
import { InstitutionModal } from '@/components/institution-modal';
import { SignupForm } from '@/components/signup-form';
import { SuspendUserModal } from '@/components/suspend-user-modal';
import { formBehavior, formCalls } from '@/tests/inertia-mock';

const inst = {
    usuario_id: 5,
    nome_fantasia: 'Casa',
    razao_social: 'Casa LTDA',
    cnpj: '11222333000181',
    telefone: '1144445555',
    endereco_completo: 'Rua B',
};

describe('InstitutionModal', () => {
    it('aprova e reprova', async () => {
        const onClose = vi.fn();
        render(
            <InstitutionModal institution={inst} isOpen onClose={onClose} />,
        );
        const u = userEvent.setup();
        expect(screen.getByRole('button', { name: 'Reprovar' })).toBeDisabled();
        await u.type(screen.getByLabelText(/Motivo/), 'motivo bem longo');
        await u.click(screen.getByRole('button', { name: 'Reprovar' }));
        expect(formCalls.at(-1)!.args[0]).toBe('/admin/institutions/5/reject');
        await u.click(screen.getByRole('button', { name: 'Aprovar' }));
        expect(formCalls.at(-1)!.args[0]).toBe('/admin/institutions/5/approve');
        await u.click(screen.getByRole('button', { name: 'Cancelar' }));
        expect(onClose).toHaveBeenCalled();
    });
    it('fecha com Escape', async () => {
        const onClose = vi.fn();
        render(
            <InstitutionModal institution={inst} isOpen onClose={onClose} />,
        );
        await userEvent.setup().keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });
});

describe('SuspendUserModal', () => {
    it('suspende', async () => {
        const onClose = vi.fn();
        render(
            <SuspendUserModal
                user={
                    {
                        id: 3,
                        nome: 'Zé',
                        email: 'z@x.com',
                        status: 'ativo',
                    } as any
                }
                isOpen
                onClose={onClose}
            />,
        );
        const u = userEvent.setup();
        await u.type(screen.getByLabelText(/Motivo/), 'abuso');
        await u.click(screen.getByRole('button', { name: 'Suspender' }));
        expect(onClose).toHaveBeenCalled();
        await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    });
    it('reativa (sem nome usa email)', async () => {
        const onClose = vi.fn();
        render(
            <SuspendUserModal
                user={
                    {
                        id: 3,
                        nome: null,
                        email: 'z@x.com',
                        status: 'suspenso',
                    } as any
                }
                isOpen
                onClose={onClose}
            />,
        );
        expect(screen.getByText(/z@x.com/)).toBeInTheDocument();
        await userEvent
            .setup()
            .click(screen.getByRole('button', { name: 'Reativar' }));
        expect(onClose).toHaveBeenCalled();
    });
    it('não fecha em erro', async () => {
        formBehavior.mode = 'error';
        const onClose = vi.fn();
        render(
            <SuspendUserModal
                user={
                    {
                        id: 3,
                        nome: 'Zé',
                        email: 'z@x.com',
                        status: 'ativo',
                    } as any
                }
                isOpen
                onClose={onClose}
            />,
        );
        await userEvent
            .setup()
            .click(screen.getByRole('button', { name: 'Suspender' }));
        expect(onClose).not.toHaveBeenCalled();
    });
});

describe('DeleteUser', () => {
    it('abre diálogo', async () => {
        render(<DeleteUser />);
        const u = userEvent.setup();
        await u.click(screen.getByTestId('delete-user-button'));
        expect(await screen.findByPlaceholderText('Senha')).toBeInTheDocument();
        await u.type(screen.getByPlaceholderText('Senha'), 'x');
        await u.click(screen.getByText('Cancelar'));
    });
});

describe('SignupForm', () => {
    it('renderiza', () => {
        render(<SignupForm className="x" />);
        expect(screen.getByText('Create your account')).toBeInTheDocument();
    });
});
