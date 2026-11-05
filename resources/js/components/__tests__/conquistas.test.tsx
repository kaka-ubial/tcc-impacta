import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConquistasSection } from '@/components/conquistas/conquistas-section';
import { ShareDialog } from '@/components/conquistas/share-dialog';
import { router } from '@/tests/inertia-mock';

const def = (o: any, k: string, v: any) =>
    Object.defineProperty(o, k, {
        value: v,
        configurable: true,
        writable: true,
    });
const c = (over: any = {}) => ({
    id: 1,
    codigo: 'x',
    nome: 'Primeira',
    descricao: 'd',
    imagem_url: '/i.png',
    conquistada: true,
    conquistado_em: '2026-01-05T00:00:00Z',
    progresso: { atual: 1, limiar: 1 },
    url_compartilhamento: null,
    ...over,
});

describe('ConquistasSection', () => {
    it('lista badges e abre compartilhar', async () => {
        render(
            <ConquistasSection
                conquistas={[
                    c(),
                    c({
                        id: 2,
                        nome: 'Bloqueada',
                        conquistada: false,
                        imagem_url: null,
                        conquistado_em: null,
                        progresso: { atual: 1, limiar: 4 },
                    }),
                    c({ id: 3, nome: 'SemData', conquistado_em: null }),
                ]}
            />,
        );
        expect(screen.getByText('(2/3)')).toBeInTheDocument();
        expect(screen.getByText('1/4')).toBeInTheDocument();
        await userEvent.setup().click(screen.getAllByText('Compartilhar')[0]);
        expect(
            await screen.findByText('Compartilhar conquista'),
        ).toBeInTheDocument();
        await userEvent.setup().keyboard('{Escape}');
    });
});

describe('ShareDialog', () => {
    it('null não renderiza', () => {
        const { container } = render(
            <ShareDialog conquista={null} onClose={() => {}} />,
        );
        expect(container).toBeEmptyDOMElement();
    });
    it('gera link', async () => {
        render(
            <ShareDialog
                conquista={c({ imagem_url: null })}
                onClose={() => {}}
            />,
        );
        await userEvent.setup().click(screen.getByText('Gerar link público'));
        expect(router.post).toHaveBeenCalledWith(
            '/conquistas/1/compartilhar',
            {},
            expect.anything(),
        );
        act(() => (router.post as any).mock.calls[0][2].onFinish());
    });
    it('copia, compartilha e para', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        const u = userEvent.setup();
        def(navigator, 'clipboard', { writeText });
        def(navigator, 'share', vi.fn().mockResolvedValue(undefined));
        render(
            <ShareDialog
                conquista={c({ url_compartilhamento: 'https://x.com/b/1' })}
                onClose={() => {}}
            />,
        );
        await u.click(screen.getByLabelText('Copiar link'));
        expect(writeText).toHaveBeenCalledWith('https://x.com/b/1');
        await u.click(screen.getByText('Compartilhar no aparelho'));
        expect((navigator as any).share).toHaveBeenCalled();
        expect(screen.getByText('WhatsApp')).toHaveAttribute(
            'href',
            expect.stringContaining('wa.me'),
        );
        await u.click(screen.getByText('Parar de compartilhar'));
        expect(router.delete).toHaveBeenCalled();
        await u.click(screen.getByDisplayValue('https://x.com/b/1'));
    });
    it('falhas de clipboard/share são toleradas', async () => {
        const u = userEvent.setup();
        def(navigator, 'clipboard', {
            writeText: vi.fn().mockRejectedValue(new Error('x')),
        });
        def(navigator, 'share', vi.fn().mockRejectedValue(new Error('x')));
        render(
            <ShareDialog
                conquista={c({ url_compartilhamento: 'https://x.com/b/1' })}
                onClose={() => {}}
            />,
        );
        await u.click(screen.getByLabelText('Copiar link'));
        await u.click(screen.getByText('Compartilhar no aparelho'));
    });
});
