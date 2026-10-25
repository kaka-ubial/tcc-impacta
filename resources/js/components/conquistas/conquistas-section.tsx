import { Award, Lock, Share2 } from 'lucide-react';
import { useState } from 'react';
import { ShareDialog } from '@/components/conquistas/share-dialog';
import { Button } from '@/components/ui/button';
import type { Conquista } from '@/types';

function formatData(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function BadgeCard({
    conquista,
    onShare,
}: {
    conquista: Conquista;
    onShare: () => void;
}) {
    const { conquistada, progresso } = conquista;
    const pct = Math.round((progresso.atual / progresso.limiar) * 100);

    return (
        <div
            className={`flex flex-col items-center gap-3 rounded-xl border p-4 text-center ${
                conquistada ? 'bg-card' : 'bg-muted/30'
            }`}
        >
            <div className="relative">
                {conquista.imagem_url ? (
                    <img
                        src={conquista.imagem_url}
                        alt={conquista.nome}
                        loading="lazy"
                        className={`size-24 object-contain ${
                            conquistada ? '' : 'opacity-40 grayscale'
                        }`}
                    />
                ) : (
                    <div className="flex size-24 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Award className="size-10" />
                    </div>
                )}
                {!conquistada && (
                    <div className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border bg-background">
                        <Lock className="size-3.5 text-muted-foreground" />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">{conquista.nome}</h3>
                <p className="text-xs text-muted-foreground">
                    {conquista.descricao}
                </p>
            </div>

            {conquistada ? (
                <div className="flex flex-col items-center gap-2">
                    {conquista.conquistado_em && (
                        <span className="text-xs text-muted-foreground">
                            Conquistado em{' '}
                            {formatData(conquista.conquistado_em)}
                        </span>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={onShare}
                    >
                        <Share2 className="size-3.5" />
                        Compartilhar
                    </Button>
                </div>
            ) : (
                <div className="flex w-full flex-col gap-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {progresso.atual}/{progresso.limiar}
                    </span>
                </div>
            )}
        </div>
    );
}

export function ConquistasSection({ conquistas }: { conquistas: Conquista[] }) {
    const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
    const selecionada = conquistas.find((c) => c.id === selecionadaId) ?? null;
    const total = conquistas.filter((c) => c.conquistada).length;

    return (
        <section className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-semibold">
                <Award className="size-4 text-muted-foreground" />
                Conquistas
                <span className="text-sm font-normal text-muted-foreground">
                    ({total}/{conquistas.length})
                </span>
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {conquistas.map((c) => (
                    <BadgeCard
                        key={c.id}
                        conquista={c}
                        onShare={() => setSelecionadaId(c.id)}
                    />
                ))}
            </div>

            <ShareDialog
                conquista={selecionada}
                onClose={() => setSelecionadaId(null)}
            />
        </section>
    );
}
