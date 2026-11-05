import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ConfirmPassword from '@/pages/auth/confirm-password';
import ForgotPassword from '@/pages/auth/forgot-password';
import Login from '@/pages/auth/login';
import RegistrationSummary from '@/pages/auth/registration-summary';
import Rejected from '@/pages/auth/rejected';
import ResetPassword from '@/pages/auth/reset-password';
import TwoFactorChallenge from '@/pages/auth/two-factor-challenge';
import VerifyEmail from '@/pages/auth/verify-email';
import { formBehavior, formSubmits } from '@/tests/inertia-mock';
import { render, screen } from '@/tests/render';

describe('Login', () => {
    it('renderiza com links e status', async () => {
        render(<Login status="Enviado!" canResetPassword canRegister />);
        expect(screen.getByText('Enviado!')).toBeInTheDocument();
        const u = userEvent.setup();
        await u.type(screen.getByLabelText('E-mail'), 'a@b.com');
        await u.type(
            document.querySelector('input[name=password]')!,
            'Senha123',
        );
        await u.click(screen.getByRole('checkbox'));
        await u.click(screen.getByRole('button', { name: /Entrar/ }));
        expect(formSubmits[0].data.email).toBe('a@b.com');
    });
    it('sem links opcionais', () => {
        render(<Login canResetPassword={false} canRegister={false} />);
        expect(screen.queryByText(/Esqueceu/i)).toBeNull();
    });
    it('mostra erros', async () => {
        formBehavior.mode = 'error';
        formBehavior.errors = { email: 'credenciais inválidas' };
        render(<Login canResetPassword canRegister />);
        const u = userEvent.setup();
        await u.type(screen.getByLabelText('E-mail'), 'a@b.com');
        await u.type(
            document.querySelector('input[name=password]')!,
            'Senha123',
        );
        await u.click(screen.getByRole('button', { name: /Entrar/ }));
        expect(
            await screen.findByText('credenciais inválidas'),
        ).toBeInTheDocument();
    });
});

describe('páginas simples de auth', () => {
    it('ForgotPassword', async () => {
        render(<ForgotPassword status="link enviado" />);
        expect(screen.getByText('link enviado')).toBeInTheDocument();
        await userEvent
            .setup()
            .click(screen.getByTestId('email-password-reset-link-button'));
        expect(formSubmits).toHaveLength(1);
    });
    it('ForgotPassword sem status', () => {
        render(<ForgotPassword />);
    });
    it('ConfirmPassword', async () => {
        render(<ConfirmPassword />);
        await userEvent
            .setup()
            .click(screen.getByTestId('confirm-password-button'));
        expect(formSubmits).toHaveLength(1);
    });
    it('VerifyEmail', async () => {
        const { unmount } = render(
            <VerifyEmail status="verification-link-sent" />,
        );
        unmount();
        render(<VerifyEmail />);
        await userEvent.setup().click(screen.getAllByRole('button')[0]);
    });
    it('Rejected', () => {
        const { unmount } = render(<Rejected motivo="Documento ilegível" />);
        expect(screen.getByText(/Documento ilegível/)).toBeInTheDocument();
        unmount();
        render(<Rejected />);
    });
    it('ResetPassword valida senha no blur', async () => {
        render(<ResetPassword token="t" email="a@b.com" />);
        const u = userEvent.setup();
        const pw = screen.getByPlaceholderText('Nova senha');
        await u.type(pw, 'fraca');
        await u.tab();
        expect(screen.getByRole('alert')).toBeInTheDocument();
        await u.clear(pw);
        await u.type(pw, 'Forte123x');
        await u.tab();
        await u.type(
            screen.getByPlaceholderText('Confirmar senha'),
            'Forte123x',
        );
        await u.click(screen.getByTestId('reset-password-button'));
        expect(formSubmits).toHaveLength(1);
    });
    it('TwoFactorChallenge alterna modo', async () => {
        render(<TwoFactorChallenge />);
        const u = userEvent.setup();
        expect(
            screen.getByText('Código de autenticação', { selector: 'h1' }),
        ).toBeInTheDocument();
        await u.keyboard('{Tab}123456');
        await u.click(screen.getByText('usar um código de recuperação'));
        expect(
            screen.getByText('Código de recuperação', { selector: 'h1' }),
        ).toBeInTheDocument();
        await u.type(screen.getByRole('textbox'), 'abc-123');
        await u.click(screen.getByRole('button', { name: 'Continuar' }));
        await u.click(screen.getByText('usar um código de autenticação'));
    });
    it('RegistrationSummary', () => {
        const ficha = {
            email: 'i@x.com',
            nome_fantasia: 'Casa',
            razao_social: 'Casa LTDA',
            cnpj: '11222333000181',
            telefone: '1144445555',
            endereco_completo: 'Rua B',
            descricao: 'Descrição',
            causas: ['Crianças', 'Idosos'],
        };
        const { unmount } = render(
            <RegistrationSummary
                ficha={ficha}
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
                        dia_semana: 2,
                        hora_inicio: '09:00:00',
                        hora_fim: '12:00:00',
                        tipo: 'coleta',
                    },
                ]}
            />,
        );
        expect(screen.getAllByText('Casa').length).toBeGreaterThan(0);
        unmount();
        render(
            <RegistrationSummary
                ficha={{
                    ...ficha,
                    telefone: null,
                    endereco_completo: null,
                    descricao: null,
                    causas: [],
                }}
                horarios={[]}
            />,
        );
        expect(screen.getAllByText('Não informado').length).toBeGreaterThan(0);
    });
});
