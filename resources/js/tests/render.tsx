import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

export * from '@testing-library/react';

export function render(ui: ReactElement, options?: RenderOptions) {
    return rtlRender(ui, {
        wrapper: ({ children }) => (
            <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        ),
        ...options,
    });
}
