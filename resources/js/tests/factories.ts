export const user = (over: Record<string, any> = {}) => ({
    id: 1,
    email: 'ana@example.com',
    avatar: undefined,
    email_verified_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    tipo_usuario: 'doador',
    doador: {
        nome_completo: 'Ana Souza',
        cpf: '52998224725',
        telefone: '11999998888',
        foto_perfil: null,
        endereco_completo: 'Rua A, 1 - Centro - São Paulo/SP - CEP 01310-100',
        latitude: -23.5,
        longitude: -46.6,
    },
    causas: [],
    ...over,
});

export const instUser = (over: Record<string, any> = {}) =>
    user({
        tipo_usuario: 'instituicao',
        doador: undefined,
        instituicao: {
            nome_fantasia: 'Casa Esperança',
            razao_social: 'Casa Esperança LTDA',
            cnpj: '11222333000181',
            telefone: '1144445555',
            endereco_completo:
                'Rua B, 2 - Centro - São Paulo/SP - CEP 01310-100',
            foto_perfil: null,
        },
        ...over,
    });

export const causa = { id: 1, nome: 'Crianças', icone: 'baby' };
