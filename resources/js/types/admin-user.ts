export interface AdminUser {
    id: number;
    nome: string | null;
    email: string;
    tipo_usuario: 'doador' | 'instituicao' | 'admin';
    status: 'ativo' | 'suspenso' | 'aguardando_validacao';
    motivo_suspensao: string | null;
    email_verified_at: string | null;
    criado_em: string | null;
}

export interface DoadorPerfil {
    usuario_id: number;
    nome_completo: string;
    cpf: string;
    telefone: string;
    endereco_completo: string | null;
}

export interface InstituicaoPerfil {
    usuario_id: number;
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    telefone: string;
    endereco_completo: string;
    descricao: string | null;
    status: string;
}
