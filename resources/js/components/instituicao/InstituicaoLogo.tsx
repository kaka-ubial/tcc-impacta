import { Building2 } from 'lucide-react';
import { useState } from 'react';

import { fotoUrl } from '@/lib/foto';
import { cn } from '@/lib/utils';

const TAMANHOS = {
    sm: { caixa: 'size-10 rounded-lg', icone: 'size-5' },
    lg: { caixa: 'size-16 rounded-xl', icone: 'size-7' },
};

/**
 * Logo da instituição, ou o ícone de prédio quando ela não enviou um (ou a
 * imagem falhou ao carregar). `object-contain` para não cortar logos que não
 * são quadrados.
 */
export function InstituicaoLogo({
    foto,
    nome,
    tamanho = 'sm',
    className,
}: {
    foto: string | null | undefined;
    nome: string;
    tamanho?: keyof typeof TAMANHOS;
    className?: string;
}) {
    const [falhou, setFalhou] = useState(false);
    const src = fotoUrl(foto);
    const { caixa, icone } = TAMANHOS[tamanho];

    if (src && !falhou) {
        return (
            <img
                src={src}
                alt={`Logo de ${nome}`}
                onError={() => setFalhou(true)}
                className={cn(
                    'shrink-0 border bg-card object-contain',
                    caixa,
                    className,
                )}
            />
        );
    }

    return (
        <div
            aria-hidden="true"
            className={cn(
                'flex shrink-0 items-center justify-center bg-primary/10 text-primary',
                caixa,
                className,
            )}
        >
            <Building2 className={icone} />
        </div>
    );
}
