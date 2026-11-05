import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    useAccessibility,
    initializeAccessibility,
    defaultAccessibility,
} from '@/hooks/use-accessibility';
import { initializeTheme, useAppearance } from '@/hooks/use-appearance';
import { useClipboard } from '@/hooks/use-clipboard';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { setPage } from '@/tests/inertia-mock';

afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
});

describe('useAccessibility', () => {
    it('atualiza, persiste, aplica classes e reseta', () => {
        localStorage.setItem(
            'accessibility',
            JSON.stringify({ highContrast: true }),
        );
        initializeAccessibility();
        expect(
            document.documentElement.classList.contains('a11y-contrast'),
        ).toBe(true);

        const { result } = renderHook(() => useAccessibility());
        act(() =>
            result.current.update({
                fontScale: 150,
                reduceMotion: true,
                underlineLinks: true,
                strongFocus: true,
                colorBlindMode: true,
            }),
        );
        expect(document.documentElement.style.fontSize).toBe('150%');
        expect(result.current.preferences.fontScale).toBe(150);
        expect(
            JSON.parse(localStorage.getItem('accessibility')!).reduceMotion,
        ).toBe(true);
        expect(document.documentElement.classList.contains('a11y-cvd')).toBe(
            true,
        );

        act(() => result.current.reset());
        expect(result.current.preferences).toEqual(defaultAccessibility);
        expect(document.documentElement.style.fontSize).toBe('');
    });
    it('tolera JSON inválido e storage quebrado', () => {
        localStorage.setItem('accessibility', '{ruim');
        initializeAccessibility();
        const { result } = renderHook(() => useAccessibility());
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('x');
        });
        act(() => result.current.update({ highContrast: false }));
        expect(result.current.preferences.highContrast).toBe(false);
    });
});

describe('useAppearance', () => {
    it('inicializa e troca de tema', () => {
        initializeTheme();
        expect(localStorage.getItem('appearance')).toBe('system');
        const { result } = renderHook(() => useAppearance());
        expect(result.current.appearance).toBe('system');
        act(() => result.current.updateAppearance('dark'));
        expect(result.current.resolvedAppearance).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        act(() => result.current.updateAppearance('light'));
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});

describe('useClipboard', () => {
    it('copia com sucesso', async () => {
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
        });
        const { result } = renderHook(() => useClipboard());
        let ok = false;
        await act(async () => {
            ok = await result.current[1]('abc');
        });
        expect(ok).toBe(true);
        expect(result.current[0]).toBe('abc');
    });
    it('falha ao copiar', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        Object.assign(navigator, {
            clipboard: { writeText: vi.fn().mockRejectedValue(new Error('x')) },
        });
        const { result } = renderHook(() => useClipboard());
        let ok = true;
        await act(async () => {
            ok = await result.current[1]('abc');
        });
        expect(ok).toBe(false);
        expect(result.current[0]).toBeNull();
    });
    it('sem suporte', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        Object.assign(navigator, { clipboard: undefined });
        const { result } = renderHook(() => useClipboard());
        expect(await result.current[1]('a')).toBe(false);
    });
});

describe('useCurrentUrl', () => {
    it('compara URLs', () => {
        setPage({}, '/doador/painel?x=1');
        const { result } = renderHook(() => useCurrentUrl());
        const r = result.current;
        expect(r.currentUrl).toBe('/doador/painel');
        expect(r.isCurrentUrl('/doador/painel')).toBe(true);
        expect(r.isCurrentUrl('/outro')).toBe(false);
        expect(r.isCurrentUrl('http://x.com/doador/painel')).toBe(true);
        expect(r.isCurrentUrl('http://[bad')).toBe(false);
        expect(
            r.isCurrentUrl({ url: '/doador/painel', method: 'get' } as any),
        ).toBe(true);
        expect(r.isCurrentOrParentUrl('/doador')).toBe(true);
        expect(r.isCurrentUrl('/a', '/a')).toBe(true);
        expect(r.whenCurrentUrl('/doador/painel', 'sim', 'nao')).toBe('sim');
        expect(r.whenCurrentUrl('/x', 'sim')).toBeNull();
    });
});

describe('hooks pequenos', () => {
    it('useInitials', () => {
        const { result } = renderHook(() => useInitials());
        expect(result.current('ana@x.com')).toBe('A');
        expect(result.current('')).toBe('');
    });
    it('useIsMobile', () => {
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });
    it('useMobileNavigation', () => {
        document.body.style.pointerEvents = 'none';
        const { result } = renderHook(() => useMobileNavigation());
        result.current();
        expect(document.body.style.pointerEvents).toBe('');
    });
});

describe('useTwoFactorAuth', () => {
    beforeEach(() => vi.restoreAllMocks());
    it('busca dados de setup e recovery', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
            const u = String(url);
            const body = u.includes('qr-code')
                ? { svg: '<svg/>' }
                : u.includes('secret')
                  ? { secretKey: 'KEY' }
                  : ['c1', 'c2'];

            return { ok: true, json: async () => body } as Response;
        });
        const { result } = renderHook(() => useTwoFactorAuth());
        await act(() => result.current.fetchSetupData());
        expect(result.current.hasSetupData).toBe(true);
        await act(() => result.current.fetchRecoveryCodes());
        expect(result.current.recoveryCodesList).toEqual(['c1', 'c2']);
        act(() => result.current.clearSetupData());
        expect(result.current.hasSetupData).toBe(false);
    });
    it('registra erros', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 500,
        } as Response);
        const { result } = renderHook(() => useTwoFactorAuth());
        await act(() => result.current.fetchSetupData());
        await act(() => result.current.fetchRecoveryCodes());
        await waitFor(() =>
            expect(result.current.errors.length).toBeGreaterThan(0),
        );
        act(() => result.current.clearErrors());
        expect(result.current.errors).toEqual([]);
        await act(() => result.current.fetchQrCode());
        await act(() => result.current.fetchSetupKey());
        expect(result.current.errors).toHaveLength(2);
    });
});
