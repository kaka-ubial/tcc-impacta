import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityPanel } from '@/components/accessibility/accessibility-panel';
import { useAccessibility } from '@/hooks/use-accessibility';

const MAIN_ID = 'conteudo-principal';

function getMain(): HTMLElement | null {
    const main = document.querySelector<HTMLElement>('main');

    if (main) {
        main.id ||= MAIN_ID;
        main.tabIndex = -1;
    }

    return main;
}

export function AccessibilityProvider() {
    const { preferences } = useAccessibility();
    const [message, setMessage] = useState('');
    const first = useRef(true);

    useEffect(() => {
        getMain();

        return router.on('navigate', () => {
            const main = getMain();

            if (first.current) {
                first.current = false;

                return;
            }

            main?.focus({ preventScroll: true });
            window.scrollTo({ top: 0 });

            if (preferences.announceNavigation) {
                // limpa antes para que o mesmo título seja anunciado de novo
                setMessage('');
                window.setTimeout(
                    () => setMessage(`${document.title} carregada`),
                    100,
                );
            }
        });
    }, [preferences.announceNavigation]);

    return (
        <>
            <a
                href={`#${MAIN_ID}`}
                onClick={(event) => {
                    event.preventDefault();
                    getMain()?.focus();
                }}
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
                Pular para o conteúdo principal
            </a>

            <div role="status" aria-live="polite" className="sr-only">
                {message}
            </div>

            <AccessibilityPanel />
        </>
    );
}
