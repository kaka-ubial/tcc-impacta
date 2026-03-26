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
