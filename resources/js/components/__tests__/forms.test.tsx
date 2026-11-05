import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EnderecoCepFields from '@/components/endereco-cep-fields';
import { HorariosCard } from '@/components/horarios-card';
import { pick } from '@/tests/helpers';
import { formBehavior, formCalls } from '@/tests/inertia-mock';

afterEach(() => vi.restoreAllMocks());

const vazio = {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
};

function Host({
    initial = vazio,
    errors,
}: {
    initial?: typeof vazio;
    errors?: any;
}) {
    const [v, setV] = useState(initial);

    return <EnderecoCepFields value={v} onChange={setV} errors={errors} />;
}

describe('EnderecoCepFields', () => {
    it('preenche via CEP digitado', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                logradouro: 'Av Paulista',
                bairro: 'Bela Vista',
                localidade: 'São Paulo',
                uf: 'SP',
            }),
        } as Response);
        render(<Host />);
        const u = userEvent.setup();
        await u.type(screen.getByLabelText('CEP'), '01310100');
        await waitFor(() =>
            expect(screen.getByLabelText('Logradouro')).toHaveValue(
                'Av Paulista',
            ),
        );
        expect(screen.getByLabelText('UF')).toHaveValue('SP');
        await u.type(screen.getByLabelText('Numero'), '10');
        await u.type(screen.getByLabelText('Complemento'), 'ap');
        await u.type(screen.getByLabelText('Bairro'), 'x');
        await u.type(screen.getByLabelText('Cidade'), 'y');
        await u.clear(screen.getByLabelText('UF'));
        await u.type(screen.getByLabelText('UF'), 'rj');
        expect(screen.getByLabelText('UF')).toHaveValue('RJ');
    });
    it('CEP não encontrado', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
        } as Response);
        render(<Host />);
        await userEvent.setup().type(screen.getByLabelText('CEP'), '99999999');
        expect(
            await screen.findByText('CEP não encontrado'),
        ).toBeInTheDocument();
    });
    it('blur: curto, vazio e completo', async () => {
        const f = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue({ ok: false } as Response);
        const u = userEvent.setup();
        const { unmount } = render(<Host initial={{ ...vazio, cep: '123' }} />);
        await u.click(screen.getByLabelText('CEP'));
        await u.tab();
        expect(
            await screen.findByText('CEP deve ter 8 dígitos'),
        ).toBeInTheDocument();
        unmount();
        render(<Host initial={vazio} />);
        await u.click(screen.getByLabelText('CEP'));
        await u.tab();
        expect(f).not.toHaveBeenCalled();
    });
    it('blur com CEP completo não encontrado', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
        } as Response);
        const u = userEvent.setup();
        render(
            <Host initial={{ ...vazio, cep: '01310-100', logradouro: 'a' }} />,
        );
        await u.click(screen.getByLabelText('CEP'));
        await u.tab();
        expect(
            await screen.findByText('CEP não encontrado'),
        ).toBeInTheDocument();
    });
    it('blur com sucesso e erros de props', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                logradouro: '',
                bairro: 'B',
                localidade: 'C',
                uf: 'SP',
            }),
        } as Response);
        render(
            <Host
                initial={{ ...vazio, cep: '01310-100', logradouro: 'orig' }}
                errors={{
                    cep: 'e1',
                    logradouro: 'e2',
                    numero: 'e3',
                    bairro: 'e4',
                    cidade: 'e5',
                    uf: 'e6',
                }}
            />,
        );
        await userEvent.setup().click(screen.getByLabelText('CEP'));
        await userEvent.setup().tab();
        await waitFor(() =>
            expect(screen.getByLabelText('Cidade')).toHaveValue('C'),
        );

        for (const e of ['e2', 'e3', 'e4', 'e5', 'e6']) {
            expect(screen.getByText(e)).toBeInTheDocument();
        }
    });
});

describe('HorariosCard', () => {
    const hs = [
        {
            id: 1,
            dia_semana: 1,
            hora_inicio: '09:00:00',
            hora_fim: '12:00:00',
            tipo: 'entrega' as const,
        },
        {
            id: 2,
            dia_semana: 2,
            hora_inicio: '10:00:00',
            hora_fim: '11:00:00',
            tipo: 'coleta' as const,
            pode_excluir: false,
        },
    ];
    it('lista, exclui e bloqueia', async () => {
        render(<HorariosCard horarios={hs} />);
        const u = userEvent.setup();
        const btns = screen.getAllByRole('button', { name: /Excluir horário/ });
        expect(btns[1]).toBeDisabled();
        await u.click(btns[0]);
        expect(formCalls.at(-1)!.method).toBe('delete');
    });
    it('vazio', () => {
        render(<HorariosCard horarios={[]} />);
        expect(screen.getByText(/Nenhum horário/)).toBeInTheDocument();
    });
    it('adiciona novo horário', async () => {
        render(<HorariosCard horarios={[]} />);
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: /Adicionar$/ }));
        const submit = await screen.findByRole('button', {
            name: 'Adicionar horário',
        });
        expect(submit).toBeDisabled();
        await pick(u, screen.getByLabelText('Tipo'), /Entrega/);
        await pick(u, screen.getByLabelText('Dia da semana'), 'Segunda-feira');
        await pick(u, screen.getByLabelText('Início'), '10:00');
        await pick(u, screen.getByLabelText('Fim'), '09:00');
        expect(screen.getByRole('alert')).toBeInTheDocument();
        await pick(u, screen.getByLabelText('Fim'), '11:00');
        await u.click(submit);
        expect(formCalls.at(-1)!.method).toBe('post');
    });
    it('exibe erros do servidor', async () => {
        formBehavior.mode = 'error';
        formBehavior.errors = { tipo: 'tipo ruim' } as any;
        render(<HorariosCard horarios={[]} />);
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: /Adicionar$/ }));
        await pick(u, await screen.findByLabelText('Tipo'), /Coleta/);
        await pick(u, screen.getByLabelText('Dia da semana'), 'Domingo');
        await pick(u, screen.getByLabelText('Início'), '10:00');
        await pick(u, screen.getByLabelText('Fim'), '11:00');
        await u.click(
            screen.getByRole('button', { name: 'Adicionar horário' }),
        );
        expect(await screen.findByText('tipo ruim')).toBeInTheDocument();
        await u.keyboard('{Escape}');
    });
});
