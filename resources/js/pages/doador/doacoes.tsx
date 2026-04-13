import { Head, Link, router } from '@inertiajs/react';
import { Building2, Calendar, Package, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { cancel as cancelRoute, index as doacoesIndex } from '@/routes/doacoes';
import { index as instituicoesIndex } from '@/routes/instituicoes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Minhas Doações', href: doacoesIndex.url() },
];

// ─── status config ────────────────────────────────────────────────────────────

type StatusKey = 'pendente' | 'confirmada' | 'entregue' | 'cancelado' | 'recusada';

const statusConfig: Record<StatusKey, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pendente:   { label: 'Aguardando confirmação', variant: 'outline' },
    confirmada: { label: 'Confirmada',             variant: 'default' },
    entregue:   { label: 'Entregue',               variant: 'secondary' },
    cancelado:  { label: 'Cancelada',              variant: 'secondary' },
    recusada:   { label: 'Recusada',               variant: 'destructive' },
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDataHora(iso: string) {
    const d = new Date(iso);
    return `${DIAS[d.getDay()]}, ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── types ────────────────────────────────────────────────────────────────────

type Agendamento = {
    data_hora: string;
    tipo: 'coleta' | 'entrega';
    endereco_referencia: string | null;
};

type Doacao = {
    id: number;
    status: StatusKey;
    instituicao: { id: number; nome_fantasia: string };
    itens: { id: number; categoria: string; quantidade: number; descricao: string | null }[];
    agendamento: Agendamento | null;
    criado_em: string;
};

type Props = { doacoes: Doacao[] };

// ─── card ─────────────────────────────────────────────────────────────────────

function DoacaoCard({ doacao }: { doacao: Doacao }) {
    const [processing, setProcessing] = useState(false);
    const cfg = statusConfig[doacao.status] ?? statusConfig.pendente;
    const canCancel = doacao.status === 'pendente' || doacao.status === 'confirmada';

    function handleCancel() {
        if (!confirm('Deseja cancelar esta solicitação?')) return;
        setProcessing(true);
        router.post(cancelRoute(doacao.id).url, {}, {
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Building2 className="text-muted-foreground size-4 shrink-0" />
                        <Link
                            href={`/instituicoes/${doacao.instituicao.id}`}
                            className="hover:text-primary font-medium transition-colors"
                        >
                            {doacao.instituicao.nome_fantasia}
                        </Link>
                    </div>
                    <Badge variant={cfg.variant} className="shrink-0 text-xs">
                        {cfg.label}
                    </Badge>
                </div>
                <span className="text-muted-foreground pl-6 text-xs">
                    Solicitado em {new Date(doacao.criado_em).toLocaleDateString('pt-BR')}
                </span>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 pt-4">
                {/* Items */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Package className="text-muted-foreground size-3.5" />
                        Itens
                    </div>
                    <ul className="flex flex-col gap-1 pl-5">
                        {doacao.itens.map((item) => (
                            <li key={item.id} className="text-sm">
                                <span className="font-medium">{item.quantidade}×</span> {item.categoria}
                                {item.descricao && (
                                    <span className="text-muted-foreground"> — {item.descricao}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Scheduling */}
                {doacao.agendamento && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Calendar className="text-muted-foreground size-3.5" />
                            Agendamento
                        </div>
                        <div className="bg-muted/40 flex flex-col gap-1 rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Badge variant={doacao.agendamento.tipo === 'coleta' ? 'default' : 'secondary'} className="text-xs">
                                    {doacao.agendamento.tipo === 'coleta' ? 'Coleta' : 'Entrega'}
                                </Badge>
                                <span>{formatDataHora(doacao.agendamento.data_hora)}</span>
                            </div>
                            {doacao.agendamento.endereco_referencia && (
                                <span className="text-muted-foreground text-xs">
                                    Endereço: {doacao.agendamento.endereco_referencia}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>

            {canCancel && (
                <>
                    <Separator />
                    <CardFooter className="pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            onClick={handleCancel}
                            disabled={processing}
                        >
                            <X className="size-3.5" />
                            Cancelar solicitação
                        </Button>
                    </CardFooter>
                </>
            )}
        </Card>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function MinhasDoacoes({ doacoes }: Props) {
    const pending = doacoes.filter((d) => d.status === 'pendente' || d.status === 'confirmada');
    const past    = doacoes.filter((d) => d.status !== 'pendente' && d.status !== 'confirmada');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Minhas Doações" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold">Minhas Doações</h1>
                        <p className="text-muted-foreground text-sm">
                            Acompanhe o status das suas solicitações.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={instituicoesIndex()}>Nova doação</Link>
                    </Button>
                </div>

                {doacoes.length === 0 ? (
                    <div className="text-muted-foreground rounded-xl border border-dashed py-16 text-center text-sm">
                        Você ainda não fez nenhuma solicitação de doação.
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {pending.length > 0 && (
                            <section className="flex flex-col gap-3">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    Em andamento ({pending.length})
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {pending.map((d) => <DoacaoCard key={d.id} doacao={d} />)}
                                </div>
                            </section>
                        )}

                        {past.length > 0 && (
                            <section className="flex flex-col gap-3">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    Histórico ({past.length})
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {past.map((d) => <DoacaoCard key={d.id} doacao={d} />)}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
