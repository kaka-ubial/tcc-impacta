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
    pode_excluir?: boolean;
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

export type Recomendacao = {
    usuario_id: number;
    nome_fantasia: string;
    endereco_completo: string;
    causas: Causa[];
    causa_overlap: number;
    distancia_km: number | null;
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
    foto_perfil: string | null;
    endereco_completo: string | null;
    latitude: number | null;
    longitude: number | null;
}

export type DoadorDoacaoResumo = {
    id: number;
    status: 'pendente' | 'confirmada' | 'entregue' | 'cancelado' | 'recusada' | 'nao_entregue';
    criado_em: string;
    eh_para_esta_instituicao: boolean;
    instituicao: {
        usuario_id: number;
        nome_fantasia: string;
    };
    itens: {
        id: number;
        categoria: string;
        quantidade: number;
    }[];
};

export type DoadorPerfil = {
    usuario_id: number;
    nome_completo: string;
    email: string;
    telefone: string;
    endereco_completo: string | null;
    foto_perfil: string | null;
    pontuacao_gamificacao: number;
    latitude: number | null;
    longitude: number | null;
    membro_desde: string | null;
    causas: Causa[];
    estatisticas: {
        total_doacoes: number;
        doacoes_concluidas: number;
        doacoes_com_instituicao: number;
        media_avaliacoes: number | null;
        total_avaliacoes: number;
    };
    doacoes_recentes: DoadorDoacaoResumo[];
};

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
    causas?: Causa[];
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
