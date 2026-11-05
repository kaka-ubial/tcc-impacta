import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { formBehavior } from '@/tests/inertia-mock';

describe('TwoFactorRecoveryCodes', () => {
    it('busca, mostra e regenera', async () => {
        const fetchRecoveryCodes = vi.fn().mockResolvedValue(undefined);
        const { rerender } = render(
            <TwoFactorRecoveryCodes
                recoveryCodesList={[]}
                fetchRecoveryCodes={fetchRecoveryCodes}
                errors={[]}
            />,
        );
        expect(fetchRecoveryCodes).toHaveBeenCalled();
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: /Ver códigos/ }));
        expect(
            screen.getByLabelText('Carregando códigos de recuperação'),
        ).toBeInTheDocument();
        rerender(
            <TwoFactorRecoveryCodes
                recoveryCodesList={['a-1', 'b-2']}
                fetchRecoveryCodes={fetchRecoveryCodes}
                errors={[]}
            />,
        );
        expect(screen.getByText('a-1')).toBeInTheDocument();
        await u.click(
            screen.getByRole('button', { name: /Gerar novos códigos/ }),
        );
        expect(fetchRecoveryCodes.mock.calls.length).toBeGreaterThan(1);
        await u.click(screen.getByRole('button', { name: /Ocultar códigos/ }));
    });
    it('com erros', () => {
        render(
            <TwoFactorRecoveryCodes
                recoveryCodesList={['x']}
                fetchRecoveryCodes={vi.fn()}
                errors={['falhou']}
            />,
        );
        expect(screen.getByText('falhou')).toBeInTheDocument();
    });
});

describe('TwoFactorSetupModal', () => {
    const base = {
        isOpen: true,
        onClose: vi.fn(),
        requiresConfirmation: false,
        twoFactorEnabled: false,
        qrCodeSvg: '<svg id="qr"/>',
        manualSetupKey: 'ABCD',
        clearSetupData: vi.fn(),
        fetchSetupData: vi.fn(),
        errors: [] as string[],
    };
    it('sem confirmação fecha', async () => {
        const props = { ...base, onClose: vi.fn(), clearSetupData: vi.fn() };
        render(<TwoFactorSetupModal {...props} />);
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: 'Continuar' }));
        expect(props.clearSetupData).toHaveBeenCalled();
        expect(props.onClose).toHaveBeenCalled();
    });
    it('copia a chave manual', async () => {
        render(<TwoFactorSetupModal {...base} />);
        const u = userEvent.setup();
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockResolvedValue(undefined) },
            configurable: true,
        });
        expect(screen.getByDisplayValue('ABCD')).toBeInTheDocument();
        const buttons = screen.getAllByRole('button');
        await u.click(buttons.find((b) => b.querySelector('svg.lucide-copy'))!);
    });
    it('busca dados quando abre sem QR e mostra spinners', () => {
        const fetchSetupData = vi.fn();
        render(
            <TwoFactorSetupModal
                {...base}
                qrCodeSvg={null}
                manualSetupKey={null}
                fetchSetupData={fetchSetupData}
            />,
        );
        expect(fetchSetupData).toHaveBeenCalled();
    });
    it('erros', () => {
        render(<TwoFactorSetupModal {...base} errors={['boom']} />);
        expect(screen.getByText('boom')).toBeInTheDocument();
    });
    it('fluxo com confirmação', async () => {
        const onClose = vi.fn();
        render(
            <TwoFactorSetupModal
                {...base}
                requiresConfirmation
                onClose={onClose}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: 'Continuar' }));
        expect(
            await screen.findByText('Verificar código de autenticação'),
        ).toBeInTheDocument();
        const confirmar = screen.getByRole('button', { name: 'Confirmar' });
        expect(confirmar).toBeDisabled();
        await u.keyboard('123456');
        await u.click(confirmar);
        expect(onClose).toHaveBeenCalled();
    });
    it('voltar e erro de código', async () => {
        formBehavior.mode = 'error';
        formBehavior.errors = {
            confirmTwoFactorAuthentication: { code: 'código inválido' },
        } as any;
        render(<TwoFactorSetupModal {...base} requiresConfirmation />);
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: 'Continuar' }));
        await u.keyboard('123456');
        await u.click(screen.getByRole('button', { name: 'Confirmar' }));
        expect(await screen.findByText('código inválido')).toBeInTheDocument();
        await u.click(screen.getByRole('button', { name: 'Voltar' }));
    });
    it('ativado fecha com Escape', async () => {
        const onClose = vi.fn();
        render(
            <TwoFactorSetupModal
                {...base}
                twoFactorEnabled
                onClose={onClose}
            />,
        );
        expect(
            screen.getByText('Autenticação em dois fatores ativada'),
        ).toBeInTheDocument();
        await userEvent.setup().keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });
});
