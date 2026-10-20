import { HandHeart, Package, Users } from 'lucide-react';

import type { InstituicaoDetalhe } from '@/types';

function Numero({
    icon: Icon,
    valor,
    rotulo,
}: {
    icon: typeof Package;
    valor: number;
    rotulo: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
            </div>
            <div className="flex flex-col">
                <span className="text-2xl leading-none font-semibold tabular-nums">
                    {valor.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-muted-foreground">{rotulo}</span>
            </div>
        </div>
    );
}

export function ImpactoResumo({
    impacto,
    isOwnProfile = false,
}: {
    impacto: InstituicaoDetalhe['impacto'];
    isOwnProfile?: boolean;
}) {
    if (impacto.doacoes_entregues === 0) {
        return (
            <div className="rounded-xl border border-dashed px-6 py-5 text-center text-sm text-muted-foreground">
                {isOwnProfile
                    ? 'Quando as primeiras doações forem entregues, o impacto da sua instituição aparece aqui.'
                    : 'Esta instituição ainda não recebeu doações pela plataforma.'}
            </div>
        );
    }

    return (
        <section
            aria-label="Impacto na plataforma"
            className="grid gap-3 sm:grid-cols-3"
        >
            <Numero
                icon={Package}
                valor={impacto.itens_recebidos}
                rotulo={
                    impacto.itens_recebidos === 1
                        ? 'item recebido'
                        : 'itens recebidos'
                }
            />
            <Numero
                icon={HandHeart}
                valor={impacto.doacoes_entregues}
                rotulo={
                    impacto.doacoes_entregues === 1
                        ? 'doação entregue'
                        : 'doações entregues'
                }
            />
            <Numero
                icon={Users}
                valor={impacto.doadores}
                rotulo={
                    impacto.doadores === 1
                        ? 'doador contribuiu'
                        : 'doadores contribuíram'
                }
            />
        </section>
    );
}
