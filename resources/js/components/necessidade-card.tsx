import { router, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Necessidade = {
    id: number;
    descricao?: string;
    prioridade: 'alta' | 'media' | 'baixa';
    quantidade_atual: number;
    quantidade_objetivo: number;
    categoria: { nome: string };
    instituicao?: { nome_fantasia: string };
};

const prioridadeConfig = {
    alta:  { variant: 'destructive', label: 'Alta prioridade' },
    media: { variant: 'default',     label: 'Média prioridade' },
    baixa: { variant: 'secondary',   label: 'Baixa prioridade' },
};

type Props = {
    necessidade: Necessidade;
    variant?: 'doador' | 'instituicao';
    onEdit?: () => void;
};

export function NecessidadeCard({ onEdit, necessidade, variant = 'doador' }: Props) {
    const isAtiva = necessidade.quantidade_atual < necessidade.quantidade_objetivo;

    const pct = Math.min(
        100,
        Math.round((necessidade.quantidade_atual / necessidade.quantidade_objetivo) * 100)
    );

    const cfg = prioridadeConfig[necessidade.prioridade];

    function handleDelete() {
        if (confirm('Tem certeza?')) {
            router.delete(`/instituicao/necessidades/${necessidade.id}`);    
        }
    }

    return (
        <div className="flex flex-col gap-3 rounded-xl border p-4 shadow-sm">

            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                        {necessidade.categoria.nome}
                    </span>

                    <Badge variant={cfg.variant} className="text-xs">
                        {cfg.label}
                    </Badge>
                </div>

                <Badge className="align-items-end" variant={isAtiva ? 'default' : 'secondary'}>
                    {isAtiva ? 'Ativa' : 'Concluída'}
                </Badge>
            </div>

            {necessidade.descricao && (
                <p className="text-muted-foreground text-sm">
                    {necessidade.descricao}
                </p>
            )}

            {variant === 'doador' && necessidade.instituicao && (
                <p className="text-muted-foreground text-xs">
                    {necessidade.instituicao.nome_fantasia}
                </p>
            )}

            <div className="flex flex-col gap-1">
                <div className="text-muted-foreground flex justify-between text-xs">
                    <span>{pct}% atendido</span>
                    <span>
                        {necessidade.quantidade_atual} / {necessidade.quantidade_objetivo}
                    </span>
                </div>

                <div className="bg-secondary h-2 rounded-full">
                    <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {variant === 'instituicao' && (
                <div className="flex gap-2 pt-2">
                    <Button onClick={onEdit}>
                        Editar
                    </Button>

                    <button
                        onClick={handleDelete}
                        className="text-destructive text-sm"
                    >
                        Deletar
                    </button>
                </div>
            )}

            {variant === 'doador' && (
                <Button size="sm" className="mt-2">
                    Quero doar
                </Button>
            )}
        </div>
    );
}