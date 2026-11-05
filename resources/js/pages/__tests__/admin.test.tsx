import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import InstitutionsList from '@/pages/admin/institutions-list';
import UserEdit from '@/pages/admin/user-edit';
import UsersList from '@/pages/admin/users-list';
import { user } from '@/tests/factories';
import { pick } from '@/tests/helpers';
import { formCalls, router, setPage } from '@/tests/inertia-mock';
import { render, screen } from '@/tests/render';

const admin = () =>
    setPage({ auth: { user: { ...user(), tipo_usuario: 'admin' } } });

describe('admin/InstitutionsList', () => {
    it('lista e abre modal', async () => {
        admin();
        const inst = {
            usuario_id: 5,
            nome_fantasia: 'Casa',
            razao_social: 'Casa LTDA',
            cnpj: '11222333000181',
            telefone: '1144445555',
            endereco_completo: 'Rua B',
        };
        render(
            <InstitutionsList
                instituicoes={[inst]}
                stats={{ pending: 1, approved: 2, rejected: 3 }}
            />,
        );
        expect(screen.getByText('Casa')).toBeInTheDocument();
        await userEvent
            .setup()
            .click(
                screen
                    .getAllByRole('button')
                    .find((b) => b.querySelector('svg[class*="lucide-eye"]'))!,
            );
        expect(
            await screen.findByText('Detalhes da Instituição'),
        ).toBeInTheDocument();
        await userEvent.setup().keyboard('{Escape}');
    });
    it('vazio', () => {
        admin();
        render(
            <InstitutionsList
                instituicoes={[]}
                stats={{ pending: 0, approved: 0, rejected: 0 }}
            />,
        );
        expect(
            screen.getByText(/Nenhuma instituição aguardando/),
        ).toBeInTheDocument();
    });
});

const usr = (o: any = {}) => ({
    id: 1,
    nome: 'Ana',
    email: 'a@x.com',
    tipo_usuario: 'doador',
    status: 'ativo',
    motivo_suspensao: null,
    email_verified_at: null,
    criado_em: null,
    ...o,
});

describe('admin/UsersList', () => {
    const base = {
        tipo_options: ['doador', 'instituicao'],
        status_options: ['ativo', 'suspenso'],
        stats: { ativo: 3, suspenso: 1 },
    };
    it('filtra e pagina', async () => {
        admin();
        const data = {
            data: [
                usr(),
                usr({
                    id: 2,
                    nome: null,
                    status: 'suspenso',
                    tipo_usuario: 'admin',
                }),
            ],
            current_page: 2,
            next_page_url: '/n',
            prev_page_url: '/p',
        };
        render(
            <UsersList
                usuarios={data as any}
                filtros={{ tipo_usuario: 'doador' }}
                {...base}
            />,
        );
        const u = userEvent.setup();
        const [tipo, status] = screen.getAllByRole('combobox');
        await pick(u, tipo, 'Todos os tipos');
        expect(router.get).toHaveBeenCalled();
        await pick(u, status, 'Suspenso');
        expect((router.get as any).mock.calls.at(-1)[1]).toMatchObject({
            status: 'suspenso',
            tipo_usuario: 'doador',
        });
        expect(screen.getByText('Página 2')).toBeInTheDocument();
    });
    it('sem paginação e vazio', async () => {
        admin();
        render(
            <UsersList
                usuarios={
                    {
                        data: [],
                        current_page: 1,
                        next_page_url: null,
                        prev_page_url: null,
                    } as any
                }
                filtros={{ status: 'ativo' }}
                {...base}
            />,
        );
        expect(
            screen.getByText(/Nenhum usuário encontrado/),
        ).toBeInTheDocument();
        await pick(
            userEvent.setup(),
            screen.getAllByRole('combobox')[0],
            'Doador',
        );
        expect((router.get as any).mock.calls[0][1]).toMatchObject({
            tipo_usuario: 'doador',
            status: 'ativo',
        });
    });
    it('só próxima página', () => {
        admin();
        render(
            <UsersList
                usuarios={
                    {
                        data: [usr()],
                        current_page: 1,
                        next_page_url: '/n',
                        prev_page_url: null,
                    } as any
                }
                filtros={{}}
                {...base}
            />,
        );
        expect(screen.getByText('Próxima')).toBeInTheDocument();
    });
});

describe('admin/UserEdit', () => {
    it('doador: edita e suspende', async () => {
        admin();
        render(
            <UserEdit
                usuario={usr() as any}
                perfil={
                    {
                        usuario_id: 1,
                        nome_completo: 'Ana S',
                        cpf: '52998224725',
                        telefone: '11999998888',
                        endereco_completo: null,
                    } as any
                }
            />,
        );
        const u = userEvent.setup();
        await u.type(screen.getByLabelText('Nome completo'), 'x');
        await u.type(screen.getByLabelText('CPF'), '1');
        await u.type(screen.getByLabelText('Telefone'), '1');
        await u.type(screen.getByLabelText('Endereço'), 'Rua');
        await u.click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );
        expect(formCalls.at(-1)!.method).toBe('put');
        await u.click(screen.getByRole('button', { name: /Suspender/ }));
        expect(
            await screen.findByText('Suspender usuário'),
        ).toBeInTheDocument();
        await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    });
    it('instituição suspensa com motivo', async () => {
        admin();
        const inst = {
            usuario_id: 1,
            nome_fantasia: 'Casa',
            razao_social: 'Casa L',
            cnpj: '1',
            telefone: '2',
            endereco_completo: 'Rua',
            descricao: null,
            status: 'ativa',
        };
        render(
            <UserEdit
                usuario={
                    usr({
                        tipo_usuario: 'instituicao',
                        status: 'suspenso',
                        motivo_suspensao: 'abuso',
                    }) as any
                }
                perfil={inst as any}
            />,
        );
        const u = userEvent.setup();
        expect(screen.getByText('abuso')).toBeInTheDocument();

        for (const l of [
            'Nome fantasia',
            'Razão social',
            'CNPJ',
            'Telefone',
            'Endereço',
            'Descrição',
        ]) {
            await u.type(screen.getByLabelText(l), 'z');
        }

        await u.click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );
        await u.click(screen.getByRole('button', { name: /Reativar/ }));
    });
    it('admin sem botão de suspender nem perfil', () => {
        admin();
        render(
            <UserEdit
                usuario={usr({ tipo_usuario: 'admin', nome: null }) as any}
                perfil={null}
            />,
        );
        expect(screen.queryByRole('button', { name: /Suspender/ })).toBeNull();
    });
});
