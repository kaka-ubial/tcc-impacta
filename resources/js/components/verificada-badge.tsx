import { BadgeCheck } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
    verificada: boolean;
    variant?: 'icon' | 'full';
};

export function VerificadaBadge({ verificada, variant = 'icon' }: Props) {
    if (!verificada) return null;

    if (variant === 'full') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-500/30">
                <BadgeCheck className="size-3.5" />
                Instituição Verificada
            </span>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <BadgeCheck className="size-4 shrink-0 text-emerald-500" aria-label="Instituição Verificada" />
            </TooltipTrigger>
            <TooltipContent side="top">
                <p>Instituição Verificada</p>
            </TooltipContent>
        </Tooltip>
    );
}
