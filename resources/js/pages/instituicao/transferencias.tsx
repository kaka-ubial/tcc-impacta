import type { RequestPayload } from '@inertiajs/core';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Ban,
    Building2,
    Calendar,
    CalendarClock,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    History,
    Package,
    PackageCheck,
    PackageX,
    Plus,
    Send,
    X,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { ItensDialog } from '@/components/itens-dialog';
import { ScrollRow } from '@/components/scroll-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { painel } from '@/routes/instituicao';
import {
    index as transferenciaIndex,
    confirmar as confirmarRoute,
    recusar as recusarRoute,
    entregar as entregarRoute,
    naoEntregue as naoEntregueRoute,
    cancelar as cancelarRoute,
    sugerir as sugerirRoute,
    aceitarSugestao as aceitarSugestaoRoute,
    recusarSugestao as recusarSugestaoRoute,
} from '@/routes/instituicao/transferencias';
import type { BreadcrumbItem, HorarioDisponivel } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: painel.url() },
    { title: 'Transferências', href: transferenciaIndex().url },
];

const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGO = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
];

function formatDataHora(iso: string) {
    const d = new Date(iso);

    return `${DIAS_CURTO[d.getDay()]}, ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function fmt(hora: string) {
    return hora.slice(0, 5);
}

function buildUpcomingDates(horarios: HorarioDisponivel[], weeks = 2) {
    const now = new Date();
    const results: { label: string; value: string }[] = [];

    for (const h of horarios) {
        for (let w = 0; w < weeks; w++) {
            const d = new Date(now);
            const dayDiff = (h.dia_semana - d.getDay() + 7) % 7;
            d.setDate(d.getDate() + dayDiff + w * 7);
            const [hh, mm] = h.hora_inicio.split(':');
            d.setHours(Number(hh), Number(mm), 0, 0);

            if (d > now) {
                const dateStr = d.toISOString().slice(0, 16);
                results.push({
                    label: `${DIAS_LONGO[h.dia_semana]}, ${d.toLocaleDateString('pt-BR')} — ${fmt(h.hora_inicio)} às ${fmt(h.hora_fim)}`,
                    value: dateStr,
                });
            }
        }
    }

    return results.sort((a, b) => a.value.localeCompare(b.value));
}

type StatusKey =
    | 'pendente'
    | 'confirmada'
    | 'entregue'
    | 'recusada'
    | 'cancelada'
    | 'alteracao_sugerida'
    | 'nao_entregue';

type Transferencia = {
    id: number;
    status: StatusKey;
    direcao: 'enviada' | 'recebida';
    criado_em: string;
    data_hora: string | null;
    data_hora_sugerida: string | null;
    tipo: 'coleta' | 'entrega';
    endereco_referencia: string | null;
    parceiro: { usuario_id: number; nome_fantasia: string };
    itens: {
        id: number;
        categoria: string;
        quantidade: number;
        descricao: string | null;
    }[];
};

type ItemResumo = { categoria: string; quantidade: number };

type Props = {
    enviadas: Transferencia[];
    recebidas: Transferencia[];
    horarios: HorarioDisponivel[];
    itensEnviados: ItemResumo[];
    itensRecebidos: ItemResumo[];
};

const statusConfig: Record<
    StatusKey,
    {
        label: string;
        icon: LucideIcon;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
> = {
    pendente: { label: 'Pendente', icon: Clock, variant: 'outline' },
    confirmada: { label: 'Confirmada', icon: CheckCircle2, variant: 'default' },
    entregue: { label: 'Entregue', icon: PackageCheck, variant: 'secondary' },
    recusada: { label: 'Recusada', icon: XCircle, variant: 'destructive' },
    cancelada: { label: 'Cancelada', icon: Ban, variant: 'secondary' },
    alteracao_sugerida: {
        label: 'Alteração sugerida',
        icon: CalendarClock,
        variant: 'outline',
    },
    nao_entregue: {
        label: 'Não entregue',
        icon: PackageX,
        variant: 'destructive',
    },
};

function TransferenciaCard({
    t,
    horarios,
}: {
    t: Transferencia;
    horarios: HorarioDisponivel[];
}) {
    const [processing, setProcessing] = useState(false);
    const [sugerindo, setSugerindo] = useState(false);
    const [novaData, setNovaData] = useState('');
    const cfg = statusConfig[t.status];

    function post(url: string, data: RequestPayload = {}) {
        setProcessing(true);
        router.post(url, data, { onFinish: () => setProcessing(false) });
    }

    const currentDateValue = t.data_hora
        ? new Date(t.data_hora).toISOString().slice(0, 16)
        : null;
    const upcomingDates = buildUpcomingDates(horarios).filter(
        (d) => d.value !== currentDateValue,
    );
    const hasHorarios = upcomingDates.length > 0;

    function handleSugerir() {
        if (!novaData) {
            return;
        }

        post(sugerirRoute(t.id).url, {
            data_hora_sugerida: novaData.replace('T', ' ') + ':00',
        });
        setSugerindo(false);
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Building2 className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium">
                                {t.parceiro.nome_fantasia}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {t.direcao === 'enviada'
                                    ? 'Enviada por você'
                                    : 'Recebida de'}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant={cfg.variant} className="gap-1 text-xs">
                            <cfg.icon className="size-3" />
                            {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {new Date(t.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-3 pt-4">
                {t.data_hora && (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Calendar className="size-3.5 text-muted-foreground" />
                            Agendamento
                        </div>
                        <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        t.tipo === 'coleta'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="text-xs"
                                >
                                    {t.tipo === 'coleta' ? 'Coleta' : 'Entrega'}
                                </Badge>
                                <span>{formatDataHora(t.data_hora)}</span>
                            </div>
                            {t.endereco_referencia && (
                                <span className="text-xs text-muted-foreground">
                                    Endereço: {t.endereco_referencia}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {t.status === 'alteracao_sugerida' && t.data_hora_sugerida && (
                    <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
                        Alteração sugerida para{' '}
                        <strong>{formatDataHora(t.data_hora_sugerida)}</strong>{' '}
                        — aguardando resposta.
                    </p>
                )}

                <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Package className="size-3.5 text-muted-foreground" />
                    Itens
                </div>
                <ul className="flex flex-col gap-1 pl-5">
                    {t.itens.map((item) => (
                        <li key={item.id} className="text-sm">
                            <span className="font-medium">
                                {item.quantidade}×
                            </span>{' '}
                            {item.categoria}
                            {item.descricao && (
                                <span className="text-muted-foreground">
                                    {' '}
                                    — {item.descricao}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>

            {t.direcao === 'recebida' && t.status === 'pendente' && (
                <>
                    <Separator />
                    <CardFooter className="flex flex-col gap-3 pt-4">
                        {sugerindo ? (
                            <div className="flex w-full flex-col gap-2">
                                <Label className="text-xs">
                                    Sugerir nova data e horário
                                </Label>
                                {hasHorarios ? (
                                    <>
                                        <Select
                                            value={novaData}
                                            onValueChange={setNovaData}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um horário" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {upcomingDates.map((d) => (
                                                    <SelectItem
                                                        key={d.value}
                                                        value={d.value}
                                                    >
                                                        {d.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() =>
                                                    setSugerindo(false)
                                                }
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                onClick={handleSugerir}
                                                disabled={
                                                    !novaData || processing
                                                }
                                            >
                                                Enviar sugestão
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs text-muted-foreground">
                                            Nenhum horário cadastrado.{' '}
                                            <Link
                                                href="/instituicao/horarios"
                                                className="text-primary underline"
                                            >
                                                Cadastre horários disponíveis
                                            </Link>{' '}
                                            para sugerir uma nova data.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSugerindo(false)}
                                        >
                                            Voltar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex w-full gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                                        onClick={() =>
                                            post(recusarRoute(t.id).url)
                                        }
                                        disabled={processing}
                                    >
                                        <X className="size-4" /> Recusar
                                    </Button>
                                    <Button
                                        className="flex-1 gap-1.5"
                                        onClick={() =>
                                            post(confirmarRoute(t.id).url)
                                        }
                                        disabled={processing}
                                    >
                                        <Check className="size-4" /> Confirmar
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-1.5"
                                    onClick={() => setSugerindo(true)}
                                >
                                    <CalendarClock className="size-3.5" />
                                    Sugerir outra data
                                </Button>
                            </>
                        )}
                    </CardFooter>
                </>
            )}

            {t.direcao === 'enviada' && t.status === 'alteracao_sugerida' && (
                <>
                    <Separator />
                    <CardFooter className="gap-2 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                            onClick={() => post(recusarSugestaoRoute(t.id).url)}
                            disabled={processing}
                        >
                            <X className="size-4" /> Recusar sugestão
                        </Button>
                        <Button
                            className="flex-1 gap-1.5"
                            onClick={() => post(aceitarSugestaoRoute(t.id).url)}
                            disabled={processing}
                        >
                            <Check className="size-4" /> Aceitar sugestão
                        </Button>
                    </CardFooter>
                </>
            )}

            {t.direcao === 'recebida' && t.status === 'confirmada' && (
                <>
                    <Separator />
                    <CardFooter className="flex flex-col gap-3 pt-4">
                        <div className="flex w-full gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                                onClick={() => post(naoEntregueRoute(t.id).url)}
                                disabled={processing}
                            >
                                <X className="size-4" /> Não entregue
                            </Button>
                            <Button
                                className="flex-1 gap-1.5"
                                onClick={() => post(entregarRoute(t.id).url)}
                                disabled={processing}
                            >
                                <Check className="size-4" /> Entregue
                            </Button>
                        </div>
                    </CardFooter>
                </>
            )}

            {t.direcao === 'enviada' && t.status === 'pendente' && (
                <>
                    <Separator />
                    <CardFooter className="pt-4">
                        <Button
                            variant="outline"
                            className="w-full gap-1.5 text-destructive hover:text-destructive"
                            onClick={() => post(cancelarRoute(t.id).url)}
                            disabled={processing}
                        >
                            <X className="size-4" /> Cancelar
                        </Button>
                    </CardFooter>
                </>
            )}
        </Card>
    );
}

const PER_PAGE = 10;

function Section({
    title,
    items,
    horarios,
    icon: Icon,
    collapsed = false,
}: {
    title: string;
    icon: LucideIcon;
    items: Transferencia[];
    horarios: HorarioDisponivel[];
    collapsed?: boolean;
}) {
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState(!collapsed);

    if (items.length === 0) {
        return null;
    }

    const totalPages = Math.ceil(items.length / PER_PAGE);
    const visivel = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const titulo = `${title} (${items.length})`;

    const cards = (
        <div className="flex flex-col gap-3">
            <ScrollRow>
                {visivel.map((x) => (
                    <div
                        key={x.id}
                        className="flex w-[22rem] shrink-0 snap-start sm:w-[26rem] [&>*]:w-full"
                    >
                        <TransferenciaCard t={x} horarios={horarios} />
                    </div>
                ))}
            </ScrollRow>
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {page} de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Próxima
                    </Button>
                </div>
            )}
        </div>
    );

    if (collapsed) {
        return (
            <Collapsible open={open} onOpenChange={setOpen} asChild>
                <section className="flex flex-col gap-3">
                    <CollapsibleTrigger className="flex w-fit items-center gap-1.5 text-sm font-semibold tracking-wide text-muted-foreground uppercase hover:text-foreground">
                        <ChevronRight
                            className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`}
                        />
                        <Icon className="size-4" />
                        {titulo}
                    </CollapsibleTrigger>
                    <CollapsibleContent>{cards}</CollapsibleContent>
                </section>
            </Collapsible>
        );
    }

    return (
        <section className="flex flex-col gap-3">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                <Icon className="size-4" />
                {titulo}
            </h2>
            {cards}
        </section>
    );
}

export default function Transferencias({
    enviadas,
    recebidas,
    horarios,
    itensEnviados,
    itensRecebidos,
}: Props) {
    const [filtro, setFiltro] = useState<'todas' | 'ativas' | 'historico'>(
        'todas',
    );

    const pendentesRecebidas = recebidas.filter((t) =>
        ['pendente', 'alteracao_sugerida'].includes(t.status),
    );
    const confirmadas = recebidas.filter((t) => t.status === 'confirmada');
    const sugeridas = enviadas.filter((t) => t.status === 'alteracao_sugerida');
    const historicoRecebidas = recebidas.filter(
        (t) =>
            !['pendente', 'confirmada', 'alteracao_sugerida'].includes(
                t.status,
            ),
    );
    const pendenteEnviadas = enviadas.filter((t) => t.status === 'pendente');
    const historicoEnviadas = enviadas.filter(
        (t) => !['pendente', 'alteracao_sugerida'].includes(t.status),
    );
    const totalAtivas =
        pendentesRecebidas.length +
        confirmadas.length +
        pendenteEnviadas.length +
        sugeridas.length;

    const filtros = [
        { key: 'todas' as const, label: 'Todas' },
        { key: 'ativas' as const, label: `Ativas (${totalAtivas})` },
        { key: 'historico' as const, label: 'Histórico' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transferências" />
            <div className="flex flex-col gap-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <ArrowLeftRight className="size-5" />
                            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                                Transferências
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {totalAtivas > 0
                                ? `${pendentesRecebidas.length} aguardando confirmação · ${pendenteEnviadas.length} enviadas pendentes`
                                : 'Nenhuma transferência ativa no momento.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ItensDialog
                            label="Itens"
                            title="Itens das transferências"
                            description="Resumo dos itens enviados e recebidos."
                            grupos={[
                                {
                                    titulo: 'Enviados',
                                    vazio: 'Nenhum item enviado ainda.',
                                    itens: itensEnviados,
                                },
                                {
                                    titulo: 'Recebidos',
                                    vazio: 'Nenhum item recebido ainda.',
                                    itens: itensRecebidos,
                                },
                            ]}
                        />
                        <Button asChild>
                            <Link href="/instituicoes" className="gap-1.5">
                                <Plus className="size-4" />
                                Nova transferência
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {filtros.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFiltro(f.key)}
                            className={[
                                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                filtro === f.key
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                            ].join(' ')}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-6">
                    {enviadas.length === 0 && recebidas.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                            Nenhuma transferência encontrada.
                        </div>
                    ) : (
                        <div className="flex min-w-0 flex-col gap-10">
                            {(filtro === 'todas' || filtro === 'ativas') && (
                                <>
                                    <Section
                                        title="Aguardando sua confirmação"
                                        icon={Clock}
                                        items={pendentesRecebidas}
                                        horarios={horarios}
                                    />
                                    <Section
                                        title="Sugestão de novo horário"
                                        icon={CalendarClock}
                                        items={sugeridas}
                                        horarios={horarios}
                                    />
                                    <Section
                                        title="Confirmadas — aguardando entrega"
                                        icon={CheckCircle2}
                                        items={confirmadas}
                                        horarios={horarios}
                                    />
                                    <Section
                                        title="Enviadas pendentes"
                                        icon={Send}
                                        items={pendenteEnviadas}
                                        horarios={horarios}
                                    />
                                </>
                            )}
                            {(filtro === 'todas' || filtro === 'historico') && (
                                <>
                                    <Section
                                        title="Histórico recebido"
                                        icon={History}
                                        items={historicoRecebidas}
                                        horarios={horarios}
                                        collapsed
                                    />
                                    <Section
                                        title="Histórico enviado"
                                        icon={History}
                                        items={historicoEnviadas}
                                        horarios={horarios}
                                        collapsed
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
