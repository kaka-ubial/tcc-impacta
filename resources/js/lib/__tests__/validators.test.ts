import { describe, expect, it, vi, afterEach } from 'vitest';
import {
    buildEnderecoCompleto,
    fetchCep,
    maskCep,
    maskCnpj,
    maskCpf,
    maskPhone,
    parseEnderecoCompleto,
    rules,
    runValidation,
    validateCnpj,
    validateCpf,
    validatePassword,
} from '@/lib/validators';

afterEach(() => vi.restoreAllMocks());

describe('máscaras', () => {
    it('maskCpf', () => {
        expect(maskCpf('12345678901')).toBe('123.456.789-01');
        expect(maskCpf('123')).toBe('123');
        expect(maskCpf('123456789012345')).toBe('123.456.789-01');
    });
    it('maskCnpj', () => {
        expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81');
        expect(maskCnpj('11')).toBe('11');
    });
    it('maskPhone fixo e celular', () => {
        expect(maskPhone('1144445555')).toBe('(11) 4444-5555');
        expect(maskPhone('11999998888')).toBe('(11) 99999-8888');
        expect(maskPhone('11')).toBe('11');
    });
    it('maskCep', () => {
        expect(maskCep('01310100')).toBe('01310-100');
        expect(maskCep('0131')).toBe('0131');
    });
});

describe('validateCpf', () => {
    it('aceita válido', () => {
        expect(validateCpf('529.982.247-25')).toBe(true);
    });
    it('rejeita tamanho, repetido e dígito errado', () => {
        expect(validateCpf('123')).toBe(false);
        expect(validateCpf('11111111111')).toBe(false);
        expect(validateCpf('52998224726')).toBe(false);
        expect(validateCpf('52998224715')).toBe(false);
    });
});

describe('validateCnpj', () => {
    it('aceita válido', () => {
        expect(validateCnpj('11.222.333/0001-81')).toBe(true);
    });
    it('rejeita inválidos', () => {
        expect(validateCnpj('123')).toBe(false);
        expect(validateCnpj('11111111111111')).toBe(false);
        expect(validateCnpj('11222333000182')).toBe(false);
        expect(validateCnpj('11222333000171')).toBe(false);
    });
});

describe('validatePassword', () => {
    it.each([
        ['Ab1', 'pelo menos 8'],
        ['ABCDEFG1', 'minúscula'],
        ['abcdefg1', 'maiúscula'],
        ['Abcdefgh', 'número'],
    ])('%s', (pw, msg) => {
        expect(validatePassword(pw)).toContain(msg);
    });
    it('aceita forte', () => {
        expect(validatePassword('Abcdefg1')).toBeNull();
    });
});

describe('rules e runValidation', () => {
    it('required / minLength', () => {
        expect(rules.required('Nome')('  ')).toBe('Nome é obrigatório');
        expect(rules.required('Nome')('a')).toBeNull();
        expect(rules.minLength(3, 'X')('ab')).toContain('3');
        expect(rules.minLength(3, 'X')('abc')).toBeNull();
    });
    it('name', () => {
        expect(rules.name('Nome')('a')).toContain('2 caracteres');
        expect(rules.name('Nome')('1 2')).toContain('2 letras');
        expect(rules.name('Nome')('Maria')).toBeNull();
    });
    it('cpf cnpj phone password cep', () => {
        expect(rules.cpf()('1')).toBe('CPF inválido');
        expect(rules.cpf()('52998224725')).toBeNull();
        expect(rules.cnpj()('1')).toBe('CNPJ inválido');
        expect(rules.cnpj()('11222333000181')).toBeNull();
        expect(rules.phone()('123')).toContain('Telefone');
        expect(rules.phone()('11999998888')).toBeNull();
        expect(rules.password()('x')).not.toBeNull();
        expect(rules.cep()('123')).toContain('CEP');
        expect(rules.cep()('01310100')).toBeNull();
    });
    it('runValidation para no primeiro erro e usa vazio p/ ausente', () => {
        const errs = runValidation(
            { a: '' },
            {
                a: [rules.required('A'), rules.minLength(5, 'A')],
                b: [rules.required('B')],
                c: [rules.required('C')],
            },
        );
        expect(errs).toEqual({
            a: 'A é obrigatório',
            b: 'B é obrigatório',
            c: 'C é obrigatório',
        });
        expect(runValidation({ a: 'x' }, { a: [rules.required('A')] })).toEqual(
            {},
        );
    });
});

describe('fetchCep', () => {
    it('retorna null para CEP inválido sem chamar fetch', async () => {
        const f = vi.spyOn(globalThis, 'fetch');
        expect(await fetchCep('123')).toBeNull();
        expect(f).not.toHaveBeenCalled();
    });
    it('retorna dados', async () => {
        const body = {
            logradouro: 'Rua',
            bairro: 'B',
            localidade: 'SP',
            uf: 'SP',
        };
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => body,
        } as Response);
        expect(await fetchCep('01310-100')).toEqual(body);
    });
    it('null em !ok, erro, e exceção', async () => {
        const f = vi.spyOn(globalThis, 'fetch');
        f.mockResolvedValueOnce({ ok: false } as Response);
        expect(await fetchCep('01310100')).toBeNull();
        f.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ erro: true }),
        } as Response);
        expect(await fetchCep('01310100')).toBeNull();
        f.mockRejectedValueOnce(new Error('x'));
        expect(await fetchCep('01310100')).toBeNull();
    });
});

describe('endereço', () => {
    const e = {
        cep: '01310-100',
        logradouro: 'Av Paulista',
        numero: '1000',
        complemento: 'Sala 2',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
    };
    it('build completo e mínimo', () => {
        expect(buildEnderecoCompleto(e)).toBe(
            'Av Paulista, 1000 - Sala 2 - Bela Vista - São Paulo/SP - CEP 01310-100',
        );
        expect(
            buildEnderecoCompleto({
                ...e,
                numero: '',
                complemento: '',
                bairro: '',
                cidade: '',
                uf: '',
                cep: '',
            }),
        ).toBe('Av Paulista');
    });
    it('parse vazio', () => {
        expect(parseEnderecoCompleto('').logradouro).toBe('');
    });
    it('parse completo', () => {
        const r = parseEnderecoCompleto(buildEnderecoCompleto(e));
        expect(r.cep).toBe('01310-100');
        expect(r.uf).toBe('SP');
        expect(r.cidade).toBe('São Paulo');
        expect(r.logradouro).toBe('Av Paulista');
        expect(r.numero).toBe('1000');
        expect(r.complemento).toBe('Sala 2');
        expect(r.bairro).toBe('Bela Vista');
    });
    it('parse simples', () => {
        const r = parseEnderecoCompleto('Rua A');
        expect(r.logradouro).toBe('Rua A');
    });
});
