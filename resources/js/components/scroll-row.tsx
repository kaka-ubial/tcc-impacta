import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Faixa horizontal com snap, scrollbar escondida, degradê nas bordas e
 * botões de navegação que só aparecem quando há conteúdo para rolar.
 */
export function ScrollRow({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [podeVoltar, setPodeVoltar] = useState(false);
    const [podeAvancar, setPodeAvancar] = useState(false);

    const atualizar = useCallback(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        setPodeVoltar(el.scrollLeft > 4);
        setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        atualizar();
        const observer = new ResizeObserver(atualizar);
        observer.observe(el);

        return () => observer.disconnect();
    }, [atualizar, children]);

    function rolar(direcao: 1 | -1) {
        const el = ref.current;

        el?.scrollBy({
            left: direcao * el.clientWidth * 0.8,
            behavior: 'smooth',
        });
    }

    return (
        <div className="group/scroll relative">
            <div
                ref={ref}
                onScroll={atualizar}
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {children}
            </div>

            {podeVoltar && (
                <>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Rolar para a esquerda"
                        onClick={() => rolar(-1)}
                        className="absolute top-1/2 left-1 size-8 -translate-y-1/2 rounded-full shadow-md"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                </>
            )}
            {podeAvancar && (
                <>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Rolar para a direita"
                        onClick={() => rolar(1)}
                        className="absolute top-1/2 right-1 size-8 -translate-y-1/2 rounded-full shadow-md"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </>
            )}
        </div>
    );
}
