export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
};

export type SimplePaginated<T> = {
    data: T[];
    current_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

export type Causa = {
    id: number;
    nome: string;
    icone: string | null;
};

export type CategoriaItem = {
    id: number;
    nome: string;
};

export type HorarioDisponivel = {
    id: number;
    dia_semana: number; // 0=domingo … 6=sábado
    hora_inicio: string; // "HH:MM:SS"
    hora_fim: string;
    tipo: 'coleta' | 'entrega';
};

export type NecessidadeAtiva = {
    id: number;
    descricao: string | null;
    quantidade_objetivo: number;
    quantidade_atual: number;
    prioridade: 'alta' | 'media' | 'baixa';
    categoria: { id: number; nome: string };
};

export type InstituicaoListItem = {
    usuario_id: number;
    nome_fantasia: string;
    endereco_completo: string;
    verificada: boolean;
    causas: Causa[];
    necessidades_ativas_count: number;
};

export type InstituicaoDetalhe = {
    usuario_id: number;
    nome_fantasia: string;
    razao_social: string;
    verificada: boolean;
    cnpj: string;
    telefone: string;
    endereco_completo: string;
    descricao: string | null;
    latitude: number | null;
    longitude: number | null;
    causas: Causa[];
    necessidades_ativas: NecessidadeAtiva[];
    horarios_disponiveis: HorarioDisponivel[];
};


export type Doador = {
    nome_completo: string;
    cpf: string;
    telefone: string;
}

export type Instituicao = {
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    telefone: string;
    endereco_completo: string;
}

export type User = {
    id: number;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    tipo_usuario: 'doador' | 'instituicao';
    instituicao ?: Instituicao;
    doador ?: Doador;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
