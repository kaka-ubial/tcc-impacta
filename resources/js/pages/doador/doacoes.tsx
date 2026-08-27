/*
 * DIRECTION CONTRACT — Minhas Doações (superfície do doador)
 * THESIS: A página abre com o próximo compromisso real do doador — a entrega ou
 *   coleta agendada — em escala de destaque, e todo o resto entra em fila atrás
 *   dele. Recusa o arranjo padrão da categoria (cabeçalho + grade uniforme de
 *   cards idênticos).
 * OWN-WORLD: paper quente (hue ~68°), terracota como identidade e ação, sálvia
 *   para sucesso, âmbar para pendências; cards quentes flat-at-rest com sombra
 *   baixa; Playfair Display apenas no numeral da data; Instrument Sans em todo
 *   o resto; motion na curva cubic-bezier(0.16, 1, 0.3, 1) com fallback de
 *   reduced-motion.
 * STORY: O doador entra, vê imediatamente quando é a próxima entrega e o que
 *   precisa de resposta, e sente — pelo extrato de impacto — que a contribuição
 *   importou. Ação principal: Nova doação.
 * FIRST VIEWPORT: Saudação + CTA no topo; cartão hero full-width com o numeral
 *   do dia em Playfair, instituição, itens e ações; abaixo, Em andamento e
 *   Histórico em grade de duas colunas.
 * FORM: "The Next Hand-off" — #6 na lista ordenada por ressonância, lead
 *   sorteado pelo roll (seed 836b69ff), travado pelo usuário na decision page.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 *   finish review, the verdict, DESIGN.md, and every shipping raster carrying
 *   its provenance.
 */

import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Calendar, MapPin, Package, Plus, X } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { StarDisplay } from '@/components/ui/star-display';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    aceitarSugestao as aceitarRoute,
    cancel as cancelRoute,
    index as doacoesIndex,
    recusarSugestao as recusarRoute,
} from '@/routes/doacoes';
import { index as instituicoesIndex } from '@/routes/instituicoes';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Minhas Doações', href: doacoesIndex.url() },
];

// ─── status config ─────────────────────────────────────────────────────────────

type StatusKey =
    | 'pendente'
    | 'confirmada'
    | 'entregue'
    | 'cancelado'
    | 'recusada'
    | 'nao_entregue';

const statusConfig: Record<StatusKey, { label: string; className: string }> = {
    pendente: {
        label: 'Aguardando confirmação',
        className: 'border-pending/30 bg-pending/10 text-pending-strong',
    },
    confirmada: {
        label: 'Confirmada',
        className: 'border-success/20 bg-success/10 text-success',
    },
    entregue: {
        label: 'Entregue',
        className: 'border-success/20 bg-success/10 text-success',
    },
    nao_entregue: {
        label: 'Não entregue',
        className: 'border-destructive/20 bg-destructive/5 text-destructive',
    },
    cancelado: {
        label: 'Cancelada',
        className: 'border-border bg-muted/50 text-muted-foreground',
    },
    recusada: {
        label: 'Recusada',
        className: 'border-destructive/20 bg-destructive/5 text-destructive',
    },
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDataHora(iso: string) {
    const d = new Date(iso);

    return `${DIAS[d.getDay()]}, ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function enterDelay(ms: number): CSSProperties {
    return { '--impacta-enter-delay': `${ms}ms` } as CSSProperties;
}

// ─── types ─────────────────────────────────────────────────────────────────────

type Agendamento = {
    data_hora: string;
    tipo: 'coleta' | 'entrega';
    endereco_referencia: string | null;
    status: 'confirmado' | 'alteracao_sugerida';
    data_hora_sugerida: string | null;
};

type Doacao = {
    id: number;
    status: StatusKey;
    instituicao: { id: number; nome_fantasia: string };
    itens: {
        id: number;
        categoria: string;
        quantidade: number;
        descricao: string | null;
    }[];
    agendamento: Agendamento | null;
    criado_em: string;
    avaliacao: { nota: number; descricao: string } | null;
};

type Props = { doacoes: Doacao[] };

// ─── shared pieces ─────────────────────────────────────────────────────────────

function resolveStatusCfg(doacao: Doacao) {
    return doacao.agendamento?.status === 'alteracao_sugerida'
        ? {
              label: 'Aguardando sua resposta',
              className: 'border-pending/30 bg-pending/10 text-pending-strong',
          }
        : (statusConfig[doacao.status] ?? statusConfig.pendente);
}

function TipoPill({ tipo }: { tipo: Agendamento['tipo'] }) {
    return (
        <span
            className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                tipo === 'coleta'
                    ? 'border-brand/20 bg-brand/8 text-brand'
                    : 'border-success/20 bg-success/8 text-success'
            }`}
        >
            {tipo === 'coleta' ? 'Coleta' : 'Entrega'}
        </span>
    );
}

function ItemChips({ itens }: { itens: Doacao['itens'] }) {
    return (
        <ul className="flex flex-wrap gap-1.5">
            {itens.map((item) => (
                <li
                    key={item.id}
                    title={item.descricao ?? undefined}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                >
                    <span className="font-semibold">{item.quantidade}×</span>
                    {item.categoria}
                </li>
            ))}
        </ul>
    );
}

function CancelAction({ doacao }: { doacao: Doacao }) {
    const [processing, setProcessing] = useState(false);

    function handleCancel() {
        setProcessing(true);
        router.post(
            cancelRoute(doacao.id).url,
            {},
            {
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive transition-colors hover:bg-destructive/8 hover:text-destructive"
                >
                    <X className="size-3.5" />
                    Cancelar solicitação
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Cancelar doação</DialogTitle>
                <DialogDescription>
                    Tem certeza que deseja cancelar a doação para{' '}
                    <span className="font-medium text-foreground">
                        {doacao.instituicao.nome_fantasia}
                    </span>
                    ?
                    {doacao.status === 'confirmada' && (
                        <span className="mt-2 block font-medium text-destructive">
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
                        {processing
                            ? 'Cancelando...'
                            : 'Confirmar cancelamento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SugestaoPanel({
    doacao,
    processing,
    onResposta,
}: {
    doacao: Doacao;
    processing: boolean;
    onResposta: (url: string) => void;
}) {
    if (
        doacao.agendamento?.status !== 'alteracao_sugerida' ||
        !doacao.agendamento.data_hora_sugerida
    ) {
        return null;
    }

    return (
        <div className="rounded-xl border border-pending/30 bg-pending/10 px-4 py-3">
            <p className="text-sm text-foreground">
                A instituição sugeriu uma nova data:{' '}
                <span className="font-semibold">
                    {formatDataHora(doacao.agendamento.data_hora_sugerida)}
                </span>
            </p>
            <div className="mt-2.5 flex gap-2">
                <Button
                    size="sm"
                    disabled={processing}
                    onClick={() => onResposta(aceitarRoute(doacao.id).url)}
                >
                    Aceitar
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={processing}
                    onClick={() => onResposta(recusarRoute(doacao.id).url)}
                >
                    Recusar
                </Button>
            </div>
        </div>
    );
}

// ─── Hero: próxima entrega/coleta ──────────────────────────────────────────────

function NextHandoffCard({ doacao }: { doacao: Doacao }) {
    const [processing, setProcessing] = useState(false);
    const ag = doacao.agendamento!;
    const data = new Date(ag.data_hora);
    const cfg = resolveStatusCfg(doacao);
    const canCancel =
        doacao.status === 'pendente' || doacao.status === 'confirmada';

    function handleSugestao(url: string) {
        setProcessing(true);
        router.post(
            url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    const diaSemana = capitalize(
        data.toLocaleDateString('pt-BR', { weekday: 'long' }),
    );
    const mes = data
        .toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '');
    const hora = data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <article
            aria-label="Próxima entrega ou coleta agendada"
            className="impacta-card impacta-enter overflow-hidden"
            style={enterDelay(90)}
        >
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:gap-0">
                {/* Data em escala de destaque */}
                <div className="flex items-center gap-4 sm:w-48 sm:shrink-0 sm:flex-col sm:items-start sm:justify-center sm:gap-1.5 sm:border-r sm:border-border sm:pr-6">
                    <span className="font-display text-6xl leading-none font-bold text-brand tabular-nums">
                        {data.getDate()}
                    </span>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">
                            {diaSemana}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {mes} · {hora}
                        </span>
                        <div className="mt-1.5">
                            <TipoPill tipo={ag.tipo} />
                        </div>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:pl-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 max-sm:w-full">
                            <Link
                                href={`/instituicoes/${doacao.instituicao.id}`}
                                className="flex items-center gap-1.5 text-lg font-semibold text-foreground transition-colors hover:text-brand"
                            >
                                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">
                                    {doacao.instituicao.nome_fantasia}
                                </span>
                            </Link>
                            {ag.endereco_referencia && (
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="size-3.5 shrink-0" />
                                    {ag.endereco_referencia}
                                </p>
                            )}
                        </div>
                        <Badge
                            variant="outline"
                            className={`shrink-0 ${cfg.className}`}
                        >
                            {cfg.label}
                        </Badge>
                    </div>

                    <ItemChips itens={doacao.itens} />

                    <SugestaoPanel
                        doacao={doacao}
                        processing={processing}
                        onResposta={handleSugestao}
                    />
                </div>
            </div>

            {canCancel && (
                <div className="flex justify-end border-t border-border px-6 py-3">
                    <CancelAction doacao={doacao} />
                </div>
            )}
        </article>
    );
}

// ─── Doação card ───────────────────────────────────────────────────────────────

function DoacaoCard({ doacao, delay = 0 }: { doacao: Doacao; delay?: number }) {
    const [processing, setProcessing] = useState(false);
    const cfg = resolveStatusCfg(doacao);
    const canCancel =
        doacao.status === 'pendente' || doacao.status === 'confirmada';

    function handleSugestao(url: string) {
        setProcessing(true);
        router.post(
            url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <article
            className="impacta-card impacta-enter flex flex-col overflow-hidden"
            style={enterDelay(delay)}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
                <div className="min-w-0">
                    <Link
                        href={`/instituicoes/${doacao.instituicao.id}`}
                        className="flex items-center gap-1.5 font-semibold text-foreground transition-colors hover:text-brand"
                    >
                        <Building2 className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                            {doacao.instituicao.nome_fantasia}
                        </span>
                    </Link>
                    <p className="mt-0.5 pl-[22px] text-xs text-muted-foreground">
                        Solicitado em{' '}
                        {new Date(doacao.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className={`shrink-0 ${cfg.className}`}
                >
                    {cfg.label}
                </Badge>
            </div>

            <div className="border-t border-border" />

            {/* Body */}
            <div className="flex flex-1 flex-col gap-4 px-5 py-4">
                {/* Items */}
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        <Package className="size-3.5" />
                        Itens
                    </div>
                    <ul className="mt-2 flex flex-col gap-1.5 pl-5">
                        {doacao.itens.map((item) => (
                            <li key={item.id} className="text-sm">
                                <span className="font-medium text-foreground">
                                    {item.quantidade}×
                                </span>{' '}
                                <span>{item.categoria}</span>
                                {item.descricao && (
                                    <span className="text-muted-foreground">
                                        {' '}
                                        — {item.descricao}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Scheduling */}
                {doacao.agendamento && (
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            <Calendar className="size-3.5" />
                            Agendamento
                        </div>
                        <div className="mt-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <TipoPill tipo={doacao.agendamento.tipo} />
                                <span className="text-foreground">
                                    {formatDataHora(
                                        doacao.agendamento.data_hora,
                                    )}
                                </span>
                            </div>
                            {doacao.agendamento.endereco_referencia && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {doacao.agendamento.endereco_referencia}
                                </p>
                            )}
                        </div>

                        <div className="mt-2">
                            <SugestaoPanel
                                doacao={doacao}
                                processing={processing}
                                onResposta={handleSugestao}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer — cancel */}
            {canCancel && (
                <div className="border-t border-border px-5 py-3">
                    <CancelAction doacao={doacao} />
                </div>
            )}

            {doacao.avaliacao && (
                <div className="flex items-center gap-2 border-t border-border px-5 py-4 text-sm text-muted-foreground">
                    <StarDisplay nota={doacao.avaliacao.nota} />
                    <span>{doacao.avaliacao.descricao}</span>
                </div>
            )}
        </article>
    );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div
            className="impacta-enter flex flex-col items-center gap-5 rounded-xl border border-dashed border-border py-20 text-center"
            style={enterDelay(90)}
        >
            <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                aria-hidden
                className="text-brand/30"
            >
                <path
                    d="M8 24h48v28a4 4 0 01-4 4H12a4 4 0 01-4-4V24z"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <path
                    d="M4 16h56a2 2 0 012 2v6H2v-6a2 2 0 012-2z"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <path
                    d="M24 16v-4a8 8 0 0116 0v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M24 36l4 4 12-12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <div>
                <p className="font-semibold text-foreground">
                    Nenhuma doação ainda
                </p>
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
    const firstName = nome.includes('@') ? null : nome.trim().split(/\s+/)[0];

    // A próxima entrega/coleta agendada comanda o hero; sem agendamento, o hero
    // colapsa e a página segue direto para as seções.
    const heroDoacao = useMemo(() => {
        const agendadas = doacoes.filter(
            (d) =>
                (d.status === 'pendente' || d.status === 'confirmada') &&
                d.agendamento?.data_hora,
        );

        if (agendadas.length === 0) return null;

        const now = Date.now();
        const futuras = agendadas
            .filter((d) => new Date(d.agendamento!.data_hora).getTime() >= now)
            .sort(
                (a, b) =>
                    new Date(a.agendamento!.data_hora).getTime() -
                    new Date(b.agendamento!.data_hora).getTime(),
            );

        if (futuras.length > 0) return futuras[0];

        return agendadas.sort(
            (a, b) =>
                new Date(b.agendamento!.data_hora).getTime() -
                new Date(a.agendamento!.data_hora).getTime(),
        )[0];
    }, [doacoes]);

    const pending = doacoes.filter(
        (d) =>
            (d.status === 'pendente' || d.status === 'confirmada') &&
            d.id !== heroDoacao?.id,
    );
    const past = doacoes.filter(
        (d) => d.status !== 'pendente' && d.status !== 'confirmada',
    );

    const stats = useMemo(
        () => ({
            total: doacoes.length,
            entregues: doacoes.filter((d) => d.status === 'entregue').length,
            pendentes: pending.length + (heroDoacao ? 1 : 0),
        }),
        [doacoes, pending.length, heroDoacao],
    );

    const instituicoesDoadas = useMemo(() => {
        const seen = new Set<number>();

        return doacoes.filter((d) => {
            const ok = !seen.has(d.instituicao.id);
            seen.add(d.instituicao.id);

            return ok;
        }).length;
    }, [doacoes]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Minhas Doações" />

            <div className="flex flex-col">
                {/* ── Header ──────────────────────────────────── */}
                <header className="full-bleed border-b border-border bg-card/60">
                    <div className="mx-auto w-full max-w-4xl px-6 py-8">
                        <div className="impacta-enter flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">
                                    Olá{firstName ? `, ${firstName}` : ''}
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Acompanhe suas doações e o que precisa de
                                    você.
                                </p>
                            </div>

                            <Button asChild className="gap-1.5">
                                <Link href={instituicoesIndex()}>
                                    <Plus className="size-4" />
                                    Nova doação
                                </Link>
                            </Button>
                        </div>

                        {/* Stats strip */}
                        {stats.total > 0 && (
                            <dl
                                className="impacta-enter mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 sm:flex sm:flex-wrap sm:gap-y-4"
                                style={enterDelay(60)}
                            >
                                <div>
                                    <dd className="text-xl font-semibold text-foreground tabular-nums">
                                        {stats.total}
                                    </dd>
                                    <dt className="mt-0.5 text-xs text-muted-foreground">
                                        {stats.total === 1
                                            ? 'doação total'
                                            : 'doações totais'}
                                    </dt>
                                </div>
                                <div className="sm:border-l sm:border-border sm:pl-6">
                                    <dd className="text-xl font-semibold text-success tabular-nums">
                                        {stats.entregues}
                                    </dd>
                                    <dt className="mt-0.5 text-xs text-muted-foreground">
                                        {stats.entregues === 1
                                            ? 'entregue'
                                            : 'entregues'}
                                    </dt>
                                </div>
                                {stats.pendentes > 0 && (
                                    <div className="sm:border-l sm:border-border sm:pl-6">
                                        <dd className="text-xl font-semibold text-pending-strong tabular-nums">
                                            {stats.pendentes}
                                        </dd>
                                        <dt className="mt-0.5 text-xs text-muted-foreground">
                                            em andamento
                                        </dt>
                                    </div>
                                )}
                                {instituicoesDoadas > 0 && (
                                    <div className="sm:border-l sm:border-border sm:pl-6">
                                        <dd className="text-xl font-semibold text-foreground tabular-nums">
                                            {instituicoesDoadas}
                                        </dd>
                                        <dt className="mt-0.5 text-xs text-muted-foreground">
                                            {instituicoesDoadas === 1
                                                ? 'instituição apoiada'
                                                : 'instituições apoiadas'}
                                        </dt>
                                    </div>
                                )}
                            </dl>
                        )}
                    </div>
                </header>

                {/* ── Content ─────────────────────────────────── */}
                <div className="mx-auto w-full max-w-4xl px-6 py-8">
                    {doacoes.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="flex flex-col gap-10">
                            {heroDoacao && (
                                <NextHandoffCard doacao={heroDoacao} />
                            )}

                            {pending.length > 0 && (
                                <section
                                    className="impacta-enter"
                                    style={enterDelay(heroDoacao ? 160 : 90)}
                                >
                                    <div className="mb-4 flex items-center gap-3">
                                        <h2 className="text-sm font-semibold text-foreground">
                                            Também em andamento
                                        </h2>
                                        <span className="flex size-5 items-center justify-center rounded-full bg-pending/15 text-xs font-semibold text-pending-strong">
                                            {pending.length}
                                        </span>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {pending.map((d, i) => (
                                            <DoacaoCard
                                                key={d.id}
                                                doacao={d}
                                                delay={
                                                    (heroDoacao ? 160 : 90) +
                                                    Math.min(i + 1, 5) * 50
                                                }
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {past.length > 0 && (
                                <section
                                    className="impacta-enter"
                                    style={enterDelay(
                                        pending.length > 0 || heroDoacao
                                            ? 240
                                            : 90,
                                    )}
                                >
                                    <div className="mb-4 flex items-center gap-3">
                                        <h2 className="text-sm font-semibold text-foreground">
                                            Histórico
                                        </h2>
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                            {past.length}
                                        </span>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {past.map((d, i) => (
                                            <DoacaoCard
                                                key={d.id}
                                                doacao={d}
                                                delay={
                                                    (pending.length > 0 ||
                                                    heroDoacao
                                                        ? 240
                                                        : 90) +
                                                    Math.min(i + 1, 5) * 50
                                                }
                                            />
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
