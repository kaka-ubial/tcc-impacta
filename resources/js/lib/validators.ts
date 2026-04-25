export function maskCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskCnpj(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }
    return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export function validateCpf(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
    let rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== Number(digits[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    return rest === Number(digits[10]);
}

export function validateCnpj(cnpj: string): boolean {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(digits)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(digits[i]) * weights1[i];
    let rest = sum % 11;
    if (rest < 2) rest = 0; else rest = 11 - rest;
    if (rest !== Number(digits[12])) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(digits[i]) * weights2[i];
    rest = sum % 11;
    if (rest < 2) rest = 0; else rest = 11 - rest;
    return rest === Number(digits[13]);
}

type ValidationRule = (value: string) => string | null;

type FieldRules = Record<string, ValidationRule[]>;

export function runValidation(data: Record<string, string>, fieldRules: FieldRules): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const [field, validators] of Object.entries(fieldRules)) {
        const value = data[field] ?? '';
        for (const validate of validators) {
            const error = validate(value);
            if (error) {
                errors[field] = error;
                break;
            }
        }
    }
    return errors;
}

export function validatePassword(password: string): string | null {
    if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
    if (!/[a-z]/.test(password)) return 'A senha deve conter pelo menos uma letra minúscula';
    if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos uma letra maiúscula';
    if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número';
    return null;
}

function validateName(name: string, label = 'Nome'): string | null {
    const trimmed = name.trim();
    if (trimmed.length < 2) return `${label} deve ter pelo menos 2 caracteres`;
    if (!/[a-zA-ZÀ-ÿ].*[a-zA-ZÀ-ÿ]/.test(trimmed)) return `${label} deve conter pelo menos 2 letras`;
    return null;
}

function validatePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) return 'Telefone inválido. Use (00) 00000-0000';
    return null;
}

// Rule factories — uso: rules.cpf(), rules.name('Label'), rules.required('Label')

export const rules = {
    required: (label: string): ValidationRule =>
        (v) => !v.trim() ? `${label} é obrigatório` : null,

    minLength: (min: number, label: string): ValidationRule =>
        (v) => v.trim().length < min ? `${label} deve ter pelo menos ${min} caracteres` : null,

    name: (label: string): ValidationRule =>
        (v) => validateName(v, label),

    cpf: (): ValidationRule =>
        (v) => !validateCpf(v) ? 'CPF inválido' : null,

    cnpj: (): ValidationRule =>
        (v) => !validateCnpj(v) ? 'CNPJ inválido' : null,

    phone: (): ValidationRule =>
        (v) => validatePhone(v),

    password: (): ValidationRule =>
        (v) => validatePassword(v),

    cep: (): ValidationRule =>
        (v) => v.replace(/\D/g, '').length !== 8 ? 'CEP deve ter 8 dígitos' : null,
};

export function maskCep(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

export type ViaCepResult = {
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
};

export async function fetchCep(cep: string): Promise<ViaCepResult | null> {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return null;

    try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        if (!res.ok) return null;
        const data: ViaCepResult = await res.json();
        if (data.erro) return null;
        return data;
    } catch {
        return null;
    }
}

export type EnderecoFields = {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
};

export function buildEnderecoCompleto(e: EnderecoFields): string {
    const parts = [e.logradouro];
    if (e.numero) parts[0] += `, ${e.numero}`;
    if (e.complemento) parts.push(e.complemento);
    if (e.bairro) parts.push(e.bairro);
    if (e.cidade && e.uf) parts.push(`${e.cidade}/${e.uf}`);
    if (e.cep) parts.push(`CEP ${e.cep}`);
    return parts.join(' - ');
}

export function parseEnderecoCompleto(endereco: string): EnderecoFields {
    const fields: EnderecoFields = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };
    if (!endereco) return fields;

    const cepMatch = endereco.match(/CEP\s*([\d.-]+)/i);
    if (cepMatch) fields.cep = cepMatch[1];

    const cidadeUfMatch = endereco.match(/([^-,]+)\/([A-Z]{2})/);
    if (cidadeUfMatch) {
        fields.cidade = cidadeUfMatch[1].trim();
        fields.uf = cidadeUfMatch[2];
    }

    const parts = endereco.replace(/\s*-\s*CEP\s*[\d.-]+/i, '').split(/\s*-\s*/);
    if (parts.length >= 1) {
        const logNum = parts[0].split(',');
        fields.logradouro = logNum[0]?.trim() || '';
        if (logNum[1]) fields.numero = logNum[1].trim();
    }
    if (parts.length >= 3) fields.bairro = parts[parts.length - 2]?.replace(/([^-,]+)\/[A-Z]{2}/, '').trim() || '';
    if (parts.length >= 4) fields.complemento = parts[1]?.trim() || '';

    return fields;
}
