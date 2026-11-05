import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import SugerirAlteracaoDialog from '@/components/doacao/SugerirAlteracaoDialog';
import { pickNth } from '@/tests/helpers';
import { formBehavior, formCalls } from '@/tests/inertia-mock';

const horarios = [
    {
        id: 1,
        dia_semana: 2,
        hora_inicio: '10:00:00',
        hora_fim: '12:00:00',
        tipo: 'coleta' as const,
    },
];

describe('SugerirAlteracaoDialog', () => {
    it('sugere nova data', async () => {
        render(
            <SugerirAlteracaoDialog
                agendamentoId={4}
                dataHoraAtual="2026-12-01T10:00:00Z"
                tipo="coleta"
                horarios={horarios}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('Sugerir outra data'));
        const enviar = await screen.findByRole('button', {
            name: 'Enviar sugestão',
        });
        expect(enviar).toBeDisabled();
        await pickNth(u, screen.getByRole('combobox'));
        await u.click(enviar);
        expect(formCalls.at(-1)!.method).toBe('post');
    });
    it('trigger customizado, erro e cancelar', async () => {
        formBehavior.mode = 'error';
        formBehavior.errors = { data_hora_sugerida: 'indisponível' };
        render(
            <SugerirAlteracaoDialog
                agendamentoId={4}
                dataHoraAtual="2026-12-01T10:00:00Z"
                tipo="coleta"
                horarios={horarios}
                trigger={<button>abrir</button>}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('abrir'));
        await pickNth(u, await screen.findByRole('combobox'));
        await u.click(screen.getByRole('button', { name: 'Enviar sugestão' }));
        expect(await screen.findByText('indisponível')).toBeInTheDocument();
        await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    });
    it('sem horários cadastrados', async () => {
        render(
            <SugerirAlteracaoDialog
                agendamentoId={4}
                dataHoraAtual="2026-12-01T10:00:00Z"
                tipo="entrega"
                horarios={horarios}
            />,
        );
        await userEvent.setup().click(screen.getByText('Sugerir outra data'));
        expect(
            await screen.findByText(/ainda não tem horários de entrega/),
        ).toBeInTheDocument();
    });
});
