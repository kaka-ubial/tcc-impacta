import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DoadorShow from '@/pages/instituicao/doadores/show';
import Estatisticas from '@/pages/instituicao/estatisticas';
import Painel from '@/pages/instituicao/painel';
import Security from '@/pages/settings/security';
import { instUser, user } from '@/tests/factories';
import { formBehavior, router, setPage } from '@/tests/inertia-mock';
import { render, screen } from '@/tests/render';

const tfa = vi.hoisted(() => ({
    value: {
        qrCodeSvg: null as string | null,
        hasSetupData: false,
        manualSetupKey: null as string | null,
        clearSetupData: () => {},
        fetchSetupData: async () => {},
        recoveryCodesList: ['c1'],
        fetchRecoveryCodes: async () => {},
        errors: [] as string[],
    },
}));
vi.mock('@/hooks/use-two-factor-auth', () => ({
    OTP_MAX_LENGTH: 6,
    useTwoFactorAuth: () => tfa.value,
}));

describe('Painel', () => {
    it.each([
        [0, 0],
        [3, 2],
    ])('contadores %s/%s', (a, b) => {
        setPage({
            auth: { user: instUser() },
            contadores: { doacoes_pendentes: a, transferencias_pendentes: b },
        });
        render(<Painel />);
        expect(screen.getByText('Casa Esperança')).toBeInTheDocument();
        expect(screen.getAllByRole('link').length).toBeGreaterThan(5);
    });
    it('sem nome', () => {
        setPage({
            auth: { user: instUser({ instituicao: undefined }) },
            contadores: { doacoes_pendentes: 0, transferencias_pendentes: 0 },
        });
        render(<Painel />);
        expect(screen.getByText('Instituição')).toBeInTheDocument();
    });
    it.each([8, 14, 20])('saudação às %sh', (h) => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 0, 5, h));
        setPage({
            auth: { user: instUser() },
            contadores: { doacoes_pendentes: 0, transferencias_pendentes: 0 },
        });
        render(<Painel />);
        vi.useRealTimers();
    });
});

const est = (over: any = {}) => ({
    periodo: '30d',
    doacoes: {
        total: 10,
        pendentes: 1,
        confirmadas: 2,
        entregues: 5,
        canceladas: 1,
        recusadas: 1,
        nao_entregue: 0,
        nao_entregues: 0,
        taxa_conclusao: 50,
    },
    serie: [{ rotulo: 'jan', solicitadas: 3, entregues: 2, canceladas: 1 }],
    doadores: { unicos: 4, primeira_vez: 3, recorrentes: 1 },
    itens_por_categoria: [{ categoria: 'Alimentos', quantidade: 10 }],
    transferencias: {
        enviadas: { pendente: 1 },
        recebidas: { entregue: 2 },
        itens_enviados: 3,
        itens_recebidos: 4,
    },
    avaliacoes: {
        total: 3,
        media: 4.5,
        distribuicao: { '5': 2, '4': 1 },
        percentual_avaliadas: 60,
    },
    ...over,
});

describe('Estatisticas', () => {
    it('renderiza e troca período', async () => {
        setPage({ auth: { user: instUser() } });
        render(<Estatisticas estatisticas={est() as any} />);
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: '90 dias' }));
        expect(router.get).toHaveBeenCalledWith(
            '/instituicao/estatisticas',
            { periodo: '90d' },
            expect.anything(),
        );
        await u.click(screen.getByRole('button', { name: 'Todo o período' }));
    });
    it('sem dados', () => {
        setPage({ auth: { user: instUser() } });
        render(
            <Estatisticas
                estatisticas={
                    est({
                        periodo: 'todo',
                        doacoes: {
                            total: 0,
                            pendentes: 0,
                            confirmadas: 0,
                            entregues: 0,
                            canceladas: 0,
                            recusadas: 0,
                            nao_entregues: 0,
                            taxa_conclusao: null,
                        },
                        serie: [],
                        itens_por_categoria: [],
                        transferencias: {
                            enviadas: {},
                            recebidas: {},
                            itens_enviados: 0,
                            itens_recebidos: 0,
                        },
                        avaliacoes: {
                            total: 0,
                            media: null,
                            distribuicao: {},
                            percentual_avaliadas: null,
                        },
                        doadores: {
                            unicos: 0,
                            primeira_vez: 0,
                            recorrentes: 0,
                        },
                    }) as any
                }
            />,
        );
        expect(
            screen.getAllByText('Sem dados no período.').length,
        ).toBeGreaterThan(0);
    });
});

const doador = (over: any = {}) => ({
    usuario_id: 3,
    nome_completo: 'Ana Souza',
    email: 'a@x.com',
    telefone: '1199',
    endereco_completo: 'Rua A',
    foto_perfil: 'a.png',
    pontuacao_gamificacao: 120,
    latitude: -23.5,
    longitude: -46.6,
    membro_desde: '2025-01-01',
    causas: [{ id: 1, nome: 'Crianças', icone: null }],
    estatisticas: {
        total_doacoes: 4,
        doacoes_concluidas: 3,
        doacoes_com_instituicao: 2,
        media_avaliacoes: 4.2,
        total_avaliacoes: 5,
    },
    doacoes_recentes: [
        {
            id: 1,
            status: 'entregue',
            criado_em: '2026-01-02T00:00:00Z',
            eh_para_esta_instituicao: true,
            instituicao: { usuario_id: 9, nome_fantasia: 'Casa' },
            itens: [{ id: 1, categoria: 'Roupas', quantidade: 2 }],
        },
        {
            id: 2,
            status: 'pendente',
            criado_em: '2026-01-03T00:00:00Z',
            eh_para_esta_instituicao: false,
            instituicao: { usuario_id: 8, nome_fantasia: 'Outra' },
            itens: [],
        },
    ],
    conquistas: [],
    ...over,
});

describe('Doador show', () => {
    it('visto pela instituição', () => {
        setPage({ auth: { user: instUser() } });
        render(<DoadorShow doador={doador() as any} />);
        expect(screen.getByText('Ana Souza')).toBeInTheDocument();
        expect(screen.getByText('Voltar para doações')).toBeInTheDocument();
    });
    it('perfil próprio e mínimo', () => {
        setPage({ auth: { user: user() } });
        render(
            <DoadorShow
                isOwnProfile
                doador={
                    doador({
                        foto_perfil: null,
                        nome_completo: '',
                        membro_desde: null,
                        causas: [],
                        doacoes_recentes: [],
                        latitude: null,
                        longitude: null,
                        endereco_completo: null,
                        estatisticas: {
                            total_doacoes: 0,
                            doacoes_concluidas: 0,
                            doacoes_com_instituicao: 0,
                            media_avaliacoes: null,
                            total_avaliacoes: 0,
                        },
                    }) as any
                }
            />,
        );
        expect(
            screen.getByText('Voltar para minhas doações'),
        ).toBeInTheDocument();
    });
});

describe('Security', () => {
    it('senha: valida e envia', async () => {
        setPage({ auth: { user: user() } }, '/settings/security');
        render(<Security />);
        const u = userEvent.setup();
        await u.type(screen.getByPlaceholderText('Senha atual'), 'Atual123');
        await u.type(screen.getByPlaceholderText('Nova senha'), 'fraca');
        await u.tab();
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
        await u.clear(screen.getByPlaceholderText('Nova senha'));
        await u.type(screen.getByPlaceholderText('Nova senha'), 'Forte1234');
        await u.tab();
        await u.type(
            screen.getByPlaceholderText('Confirme nova senha'),
            'Forte1234',
        );
        await u.click(screen.getByTestId('update-password-button'));
        expect(await screen.findByText('Salvo')).toBeInTheDocument();
    });
    it('senha: erro foca campos', async () => {
        formBehavior.mode = 'error';
        formBehavior.errors = { password: 'ruim', current_password: 'errada' };
        setPage({ auth: { user: user() } }, '/settings/security');
        render(<Security />);
        const u = userEvent.setup();
        await u.type(screen.getByPlaceholderText('Senha atual'), 'x');
        await u.type(screen.getByPlaceholderText('Nova senha'), 'Forte1234');
        await u.type(
            screen.getByPlaceholderText('Confirme nova senha'),
            'Forte1234',
        );
        await u.click(screen.getByTestId('update-password-button'));
        expect(await screen.findByText('ruim')).toBeInTheDocument();
    });
    it('2FA desativado: ativar', async () => {
        setPage({ auth: { user: user() } }, '/settings/security');
        const { unmount } = render(
            <Security canManageTwoFactor requiresConfirmation />,
        );
        await userEvent
            .setup()
            .click(screen.getByRole('button', { name: /Ativar 2FA/ }));
        expect(
            await screen.findByText('Ativar autenticação em dois fatores'),
        ).toBeInTheDocument();
        unmount();
        tfa.value = {
            ...tfa.value,
            hasSetupData: true,
            qrCodeSvg: '<svg/>',
            manualSetupKey: 'K',
        };
        render(<Security canManageTwoFactor requiresConfirmation />);
        await userEvent
            .setup()
            .click(
                screen.getByRole('button', { name: /Continuar configuração/ }),
            );
        tfa.value = {
            ...tfa.value,
            hasSetupData: false,
            qrCodeSvg: null,
            manualSetupKey: null,
        };
    });
    it('2FA ativado', async () => {
        setPage({ auth: { user: user() } }, '/settings/security');
        render(<Security canManageTwoFactor twoFactorEnabled />);
        expect(
            screen.getByRole('button', { name: /Desativar 2FA/ }),
        ).toBeInTheDocument();
        await userEvent
            .setup()
            .click(screen.getByRole('button', { name: /Desativar 2FA/ }));
    });
});
