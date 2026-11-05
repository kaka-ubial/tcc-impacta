import { afterEach, describe, expect, it, vi } from 'vitest';
import { fotoUrl } from '@/lib/foto';
import { geocodeAddress } from '@/lib/geocode';
import { DIAS, HORAS } from '@/lib/horarios';
import { tempoRelativo } from '@/lib/tempo';
import { cn, toUrl } from '@/lib/utils';

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('fotoUrl', () => {
    it('casos', () => {
        expect(fotoUrl(null)).toBeUndefined();
        expect(fotoUrl('')).toBeUndefined();
        expect(fotoUrl('http://x/y.png')).toBe('http://x/y.png');
        expect(fotoUrl('https://x/y.png')).toBe('https://x/y.png');
        expect(fotoUrl('/a.png')).toBe('/a.png');
        expect(fotoUrl('a.png')).toBe('/storage/a.png');
    });
});

describe('geocodeAddress', () => {
    it('retorna coordenadas', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            json: async () => [{ lat: '-23.5', lon: '-46.6' }],
        } as Response);
        expect(await geocodeAddress('x')).toEqual({ lat: -23.5, lon: -46.6 });
    });
    it('null se vazio ou erro', async () => {
        const f = vi.spyOn(globalThis, 'fetch');
        f.mockResolvedValueOnce({ json: async () => [] } as Response);
        expect(await geocodeAddress('x')).toBeNull();
        f.mockRejectedValueOnce(new Error('x'));
        expect(await geocodeAddress('x')).toBeNull();
    });
});

describe('horarios', () => {
    it('DIAS e HORAS', () => {
        expect(DIAS).toHaveLength(7);
        expect(HORAS[0]).toBe('06:00');
        expect(HORAS[1]).toBe('06:30');
        expect(HORAS.at(-1)).toBe('22:00');
    });
});

describe('tempoRelativo', () => {
    it('faixas', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
        const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
        expect(tempoRelativo(ago(10_000))).toBe('agora');
        expect(tempoRelativo(ago(5 * 60_000))).toBe('há 5 min');
        expect(tempoRelativo(ago(3 * 3600_000))).toBe('há 3 h');
        expect(tempoRelativo(ago(2 * 86400_000))).toBe('há 2 d');
        expect(tempoRelativo(ago(10 * 86400_000))).toMatch(
            /\d{2}\/\d{2}\/\d{4}/,
        );
    });
});

describe('utils', () => {
    it('cn e toUrl', () => {
        expect(cn('a', undefined, 'p-2', 'p-4')).toBe('a p-4');
        expect(toUrl('/x')).toBe('/x');
        expect(toUrl({ url: '/y', method: 'get' } as any)).toBe('/y');
    });
});
