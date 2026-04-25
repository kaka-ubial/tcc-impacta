import { BadgeCheck } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
    verificada: boolean;
    variant?: 'icon' | 'full';
};

export function VerificadaBadge({ verificada, variant = 'icon' }: Props) {
    if (!verificada) {
return null;
}

    if (variant === 'full') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                <BadgeCheck className="size-3.5" />
                Instituição Verificada
            </span>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <BadgeCheck className="size-4 shrink-0 text-success" aria-label="Instituição Verificada" />
            </TooltipTrigger>
            <TooltipContent side="top">
                <p>Instituição Verificada</p>
            </TooltipContent>
        </Tooltip>
    );
}
