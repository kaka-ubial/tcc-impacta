import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import InstituicaoShow from '@/pages/instituicoes/show';
import { instUser, user } from '@/tests/factories';
import { setPage } from '@/tests/inertia-mock';
import { render, screen, waitFor } from '@/tests/render';

const causas = [{ id: 1, nome: 'Crianças', icone: 'paw' }];
const detalhe = (o: any = {}) => ({
    usuario_id: 9,
    nome_fantasia: 'Casa Esperança',
    foto_perfil: null,
    razao_social: 'Casa Esperança LTDA',
    verificada: true,
    cnpj: '11222333000181',
    telefone: '1144445555',
    endereco_completo: 'Rua B, 2',
    descricao: 'Descrição longa',
    latitude: -23.5,
    longitude: -46.6,
    causas,
    necessidades_ativas: [
        {
            id: 1,
            descricao: 'Cestas',
            quantidade_objetivo: 10,
            quantidade_atual: 2,
            prioridade: 'alta',
            categoria: { id: 1, nome: 'Alimentos' },
        },
        {
            id: 2,
            descricao: null,
            quantidade_objetivo: 5,
            quantidade_atual: 5,
            prioridade: 'media',
            categoria: { id: 2, nome: 'Roupas' },
        },
        {
            id: 3,
            descricao: 'x',
            quantidade_objetivo: 5,
            quantidade_atual: 0,
            prioridade: 'baixa',
            categoria: { id: 3, nome: 'Livros' },
        },
    ],
    horarios_disponiveis: [
        {
            id: 1,
            dia_semana: 1,
            hora_inicio: '09:00:00',
            hora_fim: '12:00:00',
            tipo: 'entrega',
        },
    ],
    impacto: { doacoes_entregues: 3, itens_recebidos: 10, doadores: 2 },
    ...o,
});
const base = {
    categorias: [{ id: 1, nome: 'Alimentos' }],
    canTransfer: false,
    estoque: {},
};

describe('InstituicaoShow', () => {
    it('doador vê perfil, mapa e abre modais', async () => {
        setPage({ auth: { user: user() } });
        const orig = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = (() => ({})) as any;
        render(<InstituicaoShow instituicao={detalhe() as any} {...base} />);
        const u = userEvent.setup();
        expect(screen.getByText('Voltar para lista')).toBeInTheDocument();
        await waitFor(() =>
            expect(
                screen.getByRole('region', { name: /Mapa/ }),
            ).toBeInTheDocument(),
        );
        await u.click(screen.getByRole('button', { name: /Quero Doar/ }));
        expect(await screen.findByText('Solicitar doação')).toBeInTheDocument();
        await u.keyboard('{Escape}');
        await u.click(
            screen.getAllByRole('button', { name: /Atender necessidade/ })[0],
        );
        expect(
            await screen.findByText('Atender necessidades'),
        ).toBeInTheDocument();
        HTMLCanvasElement.prototype.getContext = orig;
    });
    it('doador sem horários e sem mapa', () => {
        setPage({ auth: { user: user() } });
        render(
            <InstituicaoShow
                instituicao={
                    detalhe({
                        horarios_disponiveis: [],
                        latitude: null,
                        longitude: null,
                        necessidades_ativas: [],
                        causas: [],
                        razao_social: 'Casa Esperança',
                    }) as any
                }
                {...base}
            />,
        );
        expect(
            screen.getAllByText(/ainda não cadastrou/).length,
        ).toBeGreaterThan(0);
        expect(
            screen.getByText(/Nenhuma necessidade ativa/),
        ).toBeInTheDocument();
    });
    it('instituição parceira pode transferir', async () => {
        setPage({ auth: { user: instUser() } });
        render(
            <InstituicaoShow
                instituicao={detalhe() as any}
                {...base}
                canTransfer
                estoque={{ 1: 5 }}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getAllByRole('button', { name: /Transferir/ })[0]);
        expect(await screen.findByText('Transferir itens')).toBeInTheDocument();
    });
    it('perfil próprio: edita causas', async () => {
        setPage({ auth: { user: instUser() } });
        render(
            <InstituicaoShow
                instituicao={
                    detalhe({ latitude: null, longitude: null }) as any
                }
                {...base}
                isOwnProfile
                horariosEditaveis={[]}
                todasCausas={causas}
            />,
        );
        const u = userEvent.setup();
        await u.click(screen.getByRole('button', { name: /Editar causas/ }));
        expect(
            await screen.findByText('Causas da instituição'),
        ).toBeInTheDocument();
        await u.keyboard('{Escape}');
        expect(
            screen.getByText(/É assim que doadores veem/),
        ).toBeInTheDocument();
    });
    it('perfil próprio sem causas', () => {
        setPage({ auth: { user: instUser() } });
        render(
            <InstituicaoShow
                instituicao={
                    detalhe({
                        causas: [],
                        descricao: null,
                        necessidades_ativas: [],
                    }) as any
                }
                {...base}
                isOwnProfile
                todasCausas={causas}
            />,
        );
        expect(
            screen.getByRole('button', { name: /Adicionar causas/ }),
        ).toBeInTheDocument();
    });
});
