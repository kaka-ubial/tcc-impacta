import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Calendar, Gift, Package, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { cancel as cancelRoute, index as doacoesIndex } from '@/routes/doacoes';
import { index as instituicoesIndex } from '@/routes/instituicoes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Minhas Doações', href: doacoesIndex.url() },
];

// ─── status config ─────────────────────────────────────────────────────────────

type StatusKey = 'pendente' | 'confirmada' | 'entregue' | 'cancelado' | 'recusada';

const statusConfig: Record<StatusKey, { label: string; className: string }> = {
    pendente:   {
        label: 'Aguardando confirmação',
        className: 'border-pending/30 bg-pending/10 text-pending',
    },
    confirmada: {
        label: 'Confirmada',
        className: 'border-success/20 bg-success/10 text-success',
    },
    entregue:   {
        label: 'Entregue',
        className: 'border-success/20 bg-success/10 text-success',
    },
    cancelado:  {
        label: 'Cancelada',
        className: 'border-border bg-muted/50 text-muted-foreground',
    },
    recusada:   {
        label: 'Recusada',
        className: 'border-destructive/20 bg-destructive/5 text-destructive',
    },
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDataHora(iso: string) {
    const d = new Date(iso);
    return `${DIAS[d.getDay()]}, ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── types ─────────────────────────────────────────────────────────────────────

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

// ─── Doação card ───────────────────────────────────────────────────────────────

function DoacaoCard({ doacao }: { doacao: Doacao }) {
    const [processing, setProcessing] = useState(false);
    const cfg = statusConfig[doacao.status] ?? statusConfig.pendente;
    const canCancel = doacao.status === 'pendente' || doacao.status === 'confirmada';

    function handleCancel() {
        setProcessing(true);
        router.post(cancelRoute(doacao.id).url, {}, {
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
                <div>
                    <Link
                        href={`/instituicoes/${doacao.instituicao.id}`}
                        className="flex items-center gap-1.5 font-semibold text-foreground hover:text-brand transition-colors"
                    >
                        <Building2 className="size-4 text-muted-foreground shrink-0" />
                        {doacao.instituicao.nome_fantasia}
                    </Link>
                    <p className="mt-0.5 pl-[22px] text-xs text-muted-foreground">
                        Solicitado em {new Date(doacao.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${cfg.className}`}
                >
                    {cfg.label}
                </Badge>
            </div>

            <Separator />

            {/* Body */}
            <div className="flex flex-col gap-4 px-5 py-4">

                {/* Items */}
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Package className="size-3.5" />
                        Itens
                    </div>
                    <ul className="mt-2 flex flex-col gap-1.5 pl-5">
                        {doacao.itens.map((item) => (
                            <li key={item.id} className="text-sm">
                                <span className="font-medium text-foreground">{item.quantidade}×</span>{' '}
                                <span>{item.categoria}</span>
                                {item.descricao && (
                                    <span className="text-muted-foreground"> — {item.descricao}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Scheduling */}
                {doacao.agendamento && (
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <Calendar className="size-3.5" />
                            Agendamento
                        </div>
                        <div className="mt-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                                    doacao.agendamento.tipo === 'coleta'
                                        ? 'border-brand/20 bg-brand/8 text-brand'
                                        : 'border-success/20 bg-success/8 text-success'
                                }`}>
                                    {doacao.agendamento.tipo === 'coleta' ? 'Coleta' : 'Entrega'}
                                </span>
                                <span className="text-foreground">
                                    {formatDataHora(doacao.agendamento.data_hora)}
                                </span>
                            </div>
                            {doacao.agendamento.endereco_referencia && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {doacao.agendamento.endereco_referencia}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer — cancel */}
            {canCancel && (
                <>
                    <Separator />
                    <CardFooter className="pt-4">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-destructive hover:text-destructive"
                                >
                                    <X className="size-3.5" />
                                    Cancelar solicitação
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>Cancelar doação</DialogTitle>
                                <DialogDescription>
                                    Tem certeza que deseja cancelar a doação para{' '}
                                    <span className="font-medium text-foreground">{doacao.instituicao.nome_fantasia}</span>?
                                    {doacao.status === 'confirmada' && (
                                        <span className="mt-2 block text-destructive font-medium">
                                            Esta doação já foi confirmada pela instituição.
                                        </span>
                                    )}
                                </DialogDescription>
                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button variant="secondary">Voltar</Button>
                                    </DialogClose>
                                    <Button
                                        variant="destructive"
                                        onClick={handleCancel}
                                        disabled={processing}
                                    >
                                        {processing ? 'Cancelando...' : 'Confirmar cancelamento'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                </>
            )}
        </article>
    );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border py-20 text-center">
            <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                aria-hidden
                className="text-muted-foreground/30"
            >
                <path d="M8 24h48v28a4 4 0 01-4 4H12a4 4 0 01-4-4V24z" stroke="currentColor" strokeWidth="2" />
                <path d="M4 16h56a2 2 0 012 2v6H2v-6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" />
                <path d="M24 16v-4a8 8 0 0116 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M24 36l4 4 12-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
                <p className="font-semibold text-foreground">Nenhuma doação ainda</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Encontre uma instituição e faça sua primeira solicitação.
                </p>
            </div>
            <Button asChild size="sm">
                <Link href={instituicoesIndex()}>
                    <Plus className="size-4" />
                    Descobrir instituições
                </Link>
            </Button>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MinhasDoacoes({ doacoes }: Props) {
    const { auth } = usePage().props;
    const nome = (auth.user as any).doador?.nome_completo ?? auth.user.email;

    const pending = doacoes.filter((d) => d.status === 'pendente' || d.status === 'confirmada');
    const past    = doacoes.filter((d) => d.status !== 'pendente' && d.status !== 'confirmada');

    const stats = useMemo(() => ({
        total: doacoes.length,
        entregues: doacoes.filter((d) => d.status === 'entregue').length,
        pendentes: pending.length,
    }), [doacoes, pending.length]);

    // Derive unique institution names they've donated to
    const instituicoesDoadas = useMemo(() => {
        const seen = new Set<number>();
        return doacoes
            .filter((d) => { const ok = !seen.has(d.instituicao.id); seen.add(d.instituicao.id); return ok; })
            .map((d) => d.instituicao);
    }, [doacoes]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Minhas Doações" />

            <div className="flex flex-col gap-0">

                {/* ── Profile header ──────────────────────────── */}
                <div className="border-b border-border bg-card px-6 py-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                    Suas doações
                                </p>
                                <h1 className="font-display mt-1.5 text-2xl font-bold text-foreground md:text-3xl">
                                    {nome}
                                </h1>
                            </div>

                            <Button asChild size="sm" className="w-fit gap-1.5">
                                <Link href={instituicoesIndex()}>
                                    <Plus className="size-3.5" />
                                    Nova doação
                                </Link>
                            </Button>
                        </div>

                        {/* Stats strip */}
                        {stats.total > 0 && (
                            <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-6">
                                <div>
                                    <span className="block text-2xl font-bold text-foreground">
                                        {stats.total}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">
                                        {stats.total === 1 ? 'doação total' : 'doações totais'}
                                    </span>
                                </div>
                                <div className="border-l border-border pl-6">
                                    <span className="block text-2xl font-bold text-success">
                                        {stats.entregues}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">
                                        {stats.entregues === 1 ? 'entregue' : 'entregues'}
                                    </span>
                                </div>
                                {stats.pendentes > 0 && (
                                    <div className="border-l border-border pl-6">
                                        <span className="block text-2xl font-bold text-pending">
                                            {stats.pendentes}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            em andamento
                                        </span>
                                    </div>
                                )}
                                {instituicoesDoadas.length > 0 && (
                                    <div className="border-l border-border pl-6">
                                        <span className="block text-2xl font-bold text-foreground">
                                            {instituicoesDoadas.length}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                            {instituicoesDoadas.length === 1 ? 'instituição apoiada' : 'instituições apoiadas'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Donation list ───────────────────────────── */}
                <div className="mx-auto w-full max-w-4xl px-6 py-8">
                    {doacoes.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="flex flex-col gap-10">
                            {pending.length > 0 && (
                                <section>
                                    <div className="mb-4 flex items-center gap-3">
                                        <h2 className="text-sm font-semibold text-foreground">
                                            Em andamento
                                        </h2>
                                        <span className="flex size-5 items-center justify-center rounded-full bg-pending/15 text-xs font-semibold text-pending">
                                            {pending.length}
                                        </span>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {pending.map((d) => (
                                            <DoacaoCard key={d.id} doacao={d} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {past.length > 0 && (
                                <section>
                                    <div className="mb-4 flex items-center gap-3">
                                        <h2 className="text-sm font-semibold text-foreground">
                                            Histórico
                                        </h2>
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                            {past.length}
                                        </span>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {past.map((d) => (
                                            <DoacaoCard key={d.id} doacao={d} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
