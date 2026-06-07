import { Head, Link, router, useForm } from '@inertiajs/react';
import { CalendarClock, Check, CheckCheck, ChevronLeft, ChevronRight, Clock, Phone, Plus, User, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { sugerir as sugerirRoute } from '@/routes/instituicao/agenda';
import {
    confirm as confirmRoute,
    deliver as deliverRoute,
    notDelivered as notDeliveredRoute,
    reject as rejectRoute,
} from '@/routes/instituicao/doacoes';
import { store as storeHorario } from '@/routes/instituicao/horarios';
import type { BreadcrumbItem } from '@/types';

// ─── types ──────────────────────────────────────────────────────────────────

type Agendamento = {
    id: number;
    doacao_id: number;
    data_hora: string;
    data_hora_sugerida: string | null;
    tipo: 'coleta' | 'entrega';
    status: 'confirmado' | 'alteracao_sugerida';
    endereco_referencia: string | null;
    doacao_status: string;
    doador: { usuario_id: number;nome: string; telefone: string };
};

type Horario = {
    id: number;
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
    tipo: 'coleta' | 'entrega';
};

type TransferenciaAgenda = {
    id: number;
    status: string;
    direcao: 'enviada' | 'recebida';
    criado_em: string;
    data_hora: string | null;
    parceiro: string;
};

type Props = { agendamentos: Agendamento[]; horarios: Horario[]; transferencias: TransferenciaAgenda[] };

// ─── constants ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: '/instituicao/painel' },
    { title: 'Agenda', href: '/instituicao/agenda' },
];

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const HORAS = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, '0');

    return [`${h}:00`, `${h}:30`];
}).flat();

// ─── helpers ────────────────────────────────────────────────────────────────

function dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDataHora(iso: string): string {
    const d = new Date(iso);

    return `${d.toLocaleDateString('pt-BR')} às ${formatHora(iso)}`;
}

// ─── status visual ──────────────────────────────────────────────────────────

function statusVisual(doacaoStatus: string, dataHora: string, agendamentoStatus?: string) {
    if (agendamentoStatus === 'alteracao_sugerida') {
        return { label: 'Aguardando resposta', chip: 'bg-pending/20 text-pending', badge: 'border-pending/30 bg-pending/10 text-pending' };
    }

    const atrasada = doacaoStatus === 'confirmada' && new Date(dataHora) < new Date();

    if (doacaoStatus === 'entregue') {
        return { label: 'Concluída', chip: 'bg-success/15 text-success', badge: 'border-success/20 bg-success/10 text-success' };
    }

    if (doacaoStatus === 'nao_entregue') {
        return { label: 'Não entregue', chip: 'bg-destructive/15 text-destructive', badge: 'border-destructive/20 bg-destructive/10 text-destructive' };
    }

    if (atrasada) {
        return { label: 'Atrasada', chip: 'bg-pending/20 text-pending', badge: 'border-pending/30 bg-pending/10 text-pending' };
    }

    if (doacaoStatus === 'confirmada') {
        return { label: 'Confirmada', chip: 'bg-primary/15 text-primary', badge: 'border-primary/20 bg-primary/10 text-primary' };
    }

    return { label: 'Pendente', chip: 'bg-muted text-muted-foreground', badge: 'border-border bg-muted text-muted-foreground' };
}

// ─── projeção de horários disponíveis ───────────────────────────────────────

function buildUpcomingDates(horarios: Horario[], tipo: 'coleta' | 'entrega', weeks = 4) {
    const agora = new Date();
    const opcoes: { label: string; value: string }[] = [];

    for (const h of horarios.filter((x) => x.tipo === tipo)) {
        for (let w = 0; w < weeks; w++) {
            const d = new Date(agora);
            const diff = (h.dia_semana - d.getDay() + 7) % 7;

            d.setDate(d.getDate() + diff + w * 7);
            d.setHours(Number(h.hora_inicio.slice(0, 2)), Number(h.hora_inicio.slice(3, 5)), 0, 0);

            if (d > agora) {
                const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

                opcoes.push({
                    label: `${DIAS[h.dia_semana]}, ${d.toLocaleDateString('pt-BR')} — ${h.hora_inicio.slice(0, 5)} às ${h.hora_fim.slice(0, 5)}`,
                    value,
                });
            }
        }
    }

    return opcoes.sort((a, b) => a.value.localeCompare(b.value));
}

// ─── suggest-change dialog ──────────────────────────────────────────────────

function SugerirDialog({ agendamento, horarios }: { agendamento: Agendamento; horarios: Horario[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ data_hora_sugerida: '' });

    const opcoes = useMemo(
        () => buildUpcomingDates(horarios, agendamento.tipo),
        [horarios, agendamento.tipo],
    );

    const tipoLabel = agendamento.tipo === 'coleta' ? 'coleta' : 'entrega';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(sugerirRoute(agendamento.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                    <CalendarClock className="size-3.5" />
                    Sugerir outra data
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Sugerir nova data</DialogTitle>
                <DialogDescription>
                    Agendado para {formatDataHora(agendamento.data_hora)}. Escolha um horário entre os que
                    você cadastrou como disponíveis para {tipoLabel} — o doador precisa aceitar para valer.
                </DialogDescription>
                {opcoes.length === 0 ? (
                    <div className="flex flex-col gap-3 pt-2">
                        <p className="text-muted-foreground text-sm">
                            Você ainda não tem horários de {tipoLabel} cadastrados. Cadastre um para poder
                            sugerir uma nova data.
                        </p>
                        <AddHorarioDialog
                            trigger={
                                <Button size="sm" className="gap-1.5 self-start">
                                    <Plus className="size-3.5" />
                                    Adicionar horário livre
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
                        <div className="flex flex-col gap-1">
                            <Label>Nova data e horário</Label>
                            <Select
                                value={data.data_hora_sugerida}
                                onValueChange={(v) => setData('data_hora_sugerida', v)}
                            >
                                <SelectTrigger><SelectValue placeholder="Selecione um horário" /></SelectTrigger>
                                <SelectContent>
                                    {opcoes.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.data_hora_sugerida && (
                                <p className="text-destructive text-xs">{errors.data_hora_sugerida}</p>
                            )}
                        </div>
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing || !data.data_hora_sugerida}>
                                {processing ? 'Enviando...' : 'Enviar sugestão'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── add-availability dialog ────────────────────────────────────────────────

function AddHorarioDialog({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        dia_semana: '',
        hora_inicio: '',
        hora_fim: '',
        tipo: '',
    });

    const horaInvalida = !!data.hora_inicio && !!data.hora_fim && data.hora_fim <= data.hora_inicio;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(storeHorario().url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button size="sm" className="gap-1.5">
                        <Plus className="size-3.5" />
                        Adicionar horário livre
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Adicionar horário livre</DialogTitle>
                <DialogDescription>
                    Defina uma janela recorrente de disponibilidade. Ela se repete toda semana no dia escolhido.
                </DialogDescription>
                <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col gap-1">
                        <Label>Tipo</Label>
                        <Select value={data.tipo} onValueChange={(v) => setData('tipo', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="entrega">Entrega (doador traz)</SelectItem>
                                <SelectItem value="coleta">Coleta (buscamos no doador)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.tipo && <p className="text-destructive text-xs">{errors.tipo}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>Dia da semana</Label>
                        <Select value={data.dia_semana} onValueChange={(v) => setData('dia_semana', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                {DIAS.map((d, i) => (
                                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.dia_semana && <p className="text-destructive text-xs">{errors.dia_semana}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <Label>Início</Label>
                            <Select value={data.hora_inicio} onValueChange={(v) => setData('hora_inicio', v)}>
                                <SelectTrigger><SelectValue placeholder="00:00" /></SelectTrigger>
                                <SelectContent>
                                    {HORAS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label>Fim</Label>
                            <Select value={data.hora_fim} onValueChange={(v) => setData('hora_fim', v)}>
                                <SelectTrigger><SelectValue placeholder="00:00" /></SelectTrigger>
                                <SelectContent>
                                    {HORAS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {horaInvalida && (
                        <p className="text-destructive text-xs">O horário de fim deve ser depois do início.</p>
                    )}
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={processing || !data.tipo || !data.dia_semana || !data.hora_inicio || !data.hora_fim || horaInvalida}
                        >
                            Adicionar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── agendamento detail ─────────────────────────────────────────────────────

function AgendamentoItem({ agendamento, horarios }: { agendamento: Agendamento; horarios: Horario[] }) {
    const [processing, setProcessing] = useState(false);
    const temSugestao = agendamento.status === 'alteracao_sugerida';
    const vis = statusVisual(agendamento.doacao_status, agendamento.data_hora, agendamento.status);
    const podeConcluir = agendamento.doacao_status === 'confirmada' && !temSugestao;
    const pendente = agendamento.doacao_status === 'pendente' && !temSugestao;

    function post(url: string) {
        setProcessing(true);
        router.post(url, {}, { preserveScroll: true, onFinish: () => setProcessing(false) });
    }

    return (
        <div className="flex flex-col gap-2 rounded-lg border px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <Link
                        href={`/instituicao/doadores/${agendamento.doador.usuario_id}`}
                        className="hover:text-primary flex items-center gap-2 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <User className="text-muted-foreground size-4 shrink-0" />
                            <span className="font-medium">{agendamento.doador.nome}</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Phone className="text-muted-foreground size-3.5 shrink-0" />
                        <span className="text-muted-foreground text-sm">{agendamento.doador.telefone}</span>
                    </div>
                </div>
                <Badge variant="outline" className={`shrink-0 text-xs ${vis.badge}`}>
                    {vis.label}
                </Badge>
            </div>

            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock className="size-3.5" />
                {agendamento.tipo === 'coleta' ? 'Coleta' : 'Entrega'} · {formatHora(agendamento.data_hora)}
            </div>

            {agendamento.endereco_referencia && (
                <p className="text-muted-foreground text-xs">{agendamento.endereco_referencia}</p>
            )}

            {temSugestao && agendamento.data_hora_sugerida && (
                <p className="text-pending bg-pending/10 rounded-md px-3 py-2 text-xs">
                    Alteração sugerida para <strong>{formatDataHora(agendamento.data_hora_sugerida)}</strong> —
                    aguardando resposta do doador.
                </p>
            )}

            {podeConcluir && (
                <div className="flex flex-col gap-2 pt-1">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1 gap-1.5"
                            disabled={processing}
                            onClick={() => post(deliverRoute(agendamento.doacao_id).url)}
                        >
                            <CheckCheck className="size-3.5" />
                            Concluída
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive flex-1 gap-1.5"
                            disabled={processing}
                            onClick={() => post(notDeliveredRoute(agendamento.doacao_id).url)}
                        >
                            <X className="size-3.5" />
                            Não entregue
                        </Button>
                    </div>
                </div>
            )}

            {pendente && (
                <div className="flex flex-col gap-2 pt-1">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="flex-1 gap-1.5"
                            disabled={processing}
                            onClick={() => post(confirmRoute(agendamento.doacao_id).url)}
                        >
                            <Check className="size-3.5" />
                            Confirmar
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive flex-1 gap-1.5"
                            disabled={processing}
                            onClick={() => post(rejectRoute(agendamento.doacao_id).url)}
                        >
                            <X className="size-3.5" />
                            Recusar
                        </Button>
                    </div>
                    <SugerirDialog agendamento={agendamento} horarios={horarios} />
                </div>
            )}
        </div>
    );
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function Agenda({ agendamentos, horarios, transferencias }: Props) {
    const hoje = new Date();
    const [ref, setRef] = useState(() => ({ ano: hoje.getFullYear(), mes: hoje.getMonth() }));
    const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

    // agendamentos agrupados por dia (YYYY-MM-DD)
    const porDia = useMemo(() => {
        const map: Record<string, Agendamento[]> = {};

        for (const a of agendamentos) {
            const k = dateKey(new Date(a.data_hora));
            (map[k] ??= []).push(a);
        }

        return map;
    }, [agendamentos]);

    // células da grade do mês (inclui dias vazios antes do dia 1)
    const celulas = useMemo(() => {
        const primeiroDiaSemana = new Date(ref.ano, ref.mes, 1).getDay();
        const diasNoMes = new Date(ref.ano, ref.mes + 1, 0).getDate();
        const arr: (Date | null)[] = [];

        for (let i = 0; i < primeiroDiaSemana; i++) {
arr.push(null);
}

        for (let d = 1; d <= diasNoMes; d++) {
arr.push(new Date(ref.ano, ref.mes, d));
}

        return arr;
    }, [ref]);

    function mudarMes(delta: number) {
        setRef((r) => {
            let mes = r.mes + delta;
            let ano = r.ano;

            if (mes < 0) {
 mes = 11; ano--; 
}

            if (mes > 11) {
 mes = 0; ano++; 
}

            return { ano, mes };
        });
        setDiaSelecionado(null);
    }

    const transferenciasPorDia = useMemo(() => {
        const map: Record<string, TransferenciaAgenda[]> = {};
        for (const t of transferencias) {
            const k = dateKey(new Date(t.data_hora ?? t.criado_em));
            (map[k] ??= []).push(t);
        }
        return map;
    }, [transferencias]);

    const hojeKey = dateKey(hoje);
    const agendamentosDoDia = diaSelecionado ? (porDia[diaSelecionado] ?? []) : [];
    const transferenciasDoDia = diaSelecionado ? (transferenciasPorDia[diaSelecionado] ?? []) : [];
    const horariosPorDia = useMemo(() => {
        const map: Record<number, Horario[]> = {};

        for (const h of horarios) {
(map[h.dia_semana] ??= []).push(h);
}

        return map;
    }, [horarios]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agenda" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold">Agenda</h1>
                        <p className="text-muted-foreground text-sm">
                            Doações agendadas e sua disponibilidade recorrente.
                        </p>
                    </div>
                    <AddHorarioDialog />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    {/* calendário */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                            <CardTitle className="text-base">
                                {MESES[ref.mes]} de {ref.ano}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="size-8" onClick={() => mudarMes(-1)}>
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="size-8" onClick={() => mudarMes(1)}>
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-1">
                                {DIAS_CURTOS.map((d) => (
                                    <div key={d} className="text-muted-foreground py-1 text-center text-xs font-semibold">
                                        {d}
                                    </div>
                                ))}
                                {celulas.map((dia, i) => {
                                    if (!dia) {
                                        return <div key={`v-${i}`} />;
                                    }

                                    const k = dateKey(dia);
                                    const itens = porDia[k] ?? [];
                                    const ehHoje = k === hojeKey;
                                    const selecionado = k === diaSelecionado;

                                    return (
                                        <button
                                            key={k}
                                            type="button"
                                            onClick={() => setDiaSelecionado(selecionado ? null : k)}
                                            className={`flex min-h-20 flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                                                selecionado
                                                    ? 'border-primary bg-primary/5'
                                                    : 'hover:bg-muted/50 border-border'
                                            }`}
                                        >
                                            <span
                                                className={`text-xs font-medium ${
                                                    ehHoje
                                                        ? 'bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {dia.getDate()}
                                            </span>
                                            <div className="flex flex-col gap-0.5">
                                                {itens.slice(0, 3).map((a) => (
                                                    <span
                                                        key={a.id}
                                                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${statusVisual(a.doacao_status, a.data_hora, a.status).chip}`}
                                                    >
                                                        {formatHora(a.data_hora)} {a.doador.nome.split(' ')[0]}
                                                    </span>
                                                ))}
                                                {itens.length > 3 && (
                                                    <span className="text-muted-foreground text-[10px]">
                                                        +{itens.length - 3} mais
                                                    </span>
                                                )}
                                                {(transferenciasPorDia[k] ?? []).slice(0, 2).map((t) => (
                                                    <span key={`t-${t.id}`} className="truncate rounded px-1 py-0.5 text-[10px] font-medium bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400">
                                                        Transf. {t.parceiro.split(' ')[0]}
                                                    </span>
                                                ))}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* painel lateral */}
                    <div className="flex flex-col gap-6">
                        {/* dia selecionado */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    {diaSelecionado
                                        ? new Date(`${diaSelecionado}T00:00`).toLocaleDateString('pt-BR', {
                                              weekday: 'long',
                                              day: '2-digit',
                                              month: 'long',
                                          })
                                        : 'Selecione um dia'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                {!diaSelecionado ? (
                                    <p className="text-muted-foreground text-sm">
                                        Clique em um dia do calendário para ver os agendamentos.
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Doações</p>
                                        {agendamentosDoDia.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">Nenhuma doação agendada.</p>
                                        ) : (
                                            agendamentosDoDia.map((a) => (
                                                <AgendamentoItem key={a.id} agendamento={a} horarios={horarios} />
                                            ))
                                        )}
                                        <Separator />
                                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Transferências</p>
                                        {transferenciasDoDia.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">Nenhuma transferência neste dia.</p>
                                        ) : (
                                            transferenciasDoDia.map((t) => (
                                                <Link key={t.id} href="/instituicao/transferencias" className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium">{t.parceiro}</span>
                                                        <span className="text-muted-foreground text-xs">{t.direcao === 'enviada' ? 'Enviada' : 'Recebida'}</span>
                                                    </div>
                                                    <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400">Transf.</span>
                                                </Link>
                                            ))
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* disponibilidade recorrente */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CalendarClock className="size-4" />
                                    Disponibilidade recorrente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                {horarios.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        Nenhum horário livre cadastrado.
                                    </p>
                                ) : (
                                    DIAS.map((nome, dia) =>
                                        horariosPorDia[dia] ? (
                                            <div key={dia} className="flex flex-col gap-1">
                                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                                                    {nome}
                                                </p>
                                                {horariosPorDia[dia].map((h) => (
                                                    <div key={h.id} className="flex items-center gap-2 text-sm">
                                                        <Badge
                                                            variant={h.tipo === 'coleta' ? 'default' : 'secondary'}
                                                            className="text-[10px]"
                                                        >
                                                            {h.tipo === 'coleta' ? 'Coleta' : 'Entrega'}
                                                        </Badge>
                                                        <span>{h.hora_inicio.slice(0, 5)} – {h.hora_fim.slice(0, 5)}</span>
                                                    </div>
                                                ))}
                                                <Separator className="mt-1" />
                                            </div>
                                        ) : null,
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
