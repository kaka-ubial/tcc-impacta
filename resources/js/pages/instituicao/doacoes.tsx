import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Ban,
    Calendar,
    CalendarClock,
    Check,
    CheckCheck,
    CheckCircle2,
    ChevronRight,
    Clock,
    History,
    Package,
    PackageCheck,
    PackageX,
    Phone,
    Star,
    User,
    X,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import SugerirAlteracaoDialog from '@/components/doacao/SugerirAlteracaoDialog';
import type { Horario } from '@/components/doacao/SugerirAlteracaoDialog';
import { ItensDialog } from '@/components/itens-dialog';
import { ScrollRow } from '@/components/scroll-row';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { StarDisplay } from '@/components/ui/star-display';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { fotoUrl } from '@/lib/foto';
import { painel } from '@/routes/instituicao';
import {
    confirm as confirmRoute,
    deliver as deliverRoute,
    notDelivered as notDeliveredRoute,
    index as doacoesIndex,
    reject as rejectRoute,
    avaliar as avaliarRoute,
} from '@/routes/instituicao/doacoes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: painel.url() },
    { title: 'Doações', href: doacoesIndex.url() },
];

type StatusKey =
    | 'pendente'
    | 'confirmada'
    | 'entregue'
    | 'cancelado'
    | 'recusada'
    | 'nao_entregue';

type Doacao = {
    id: number;
    status: StatusKey;
    doador: {
        usuario_id: number;
        nome: string;
        telefone: string;
        foto_perfil: string | null;
    };
    itens: {
        id: number;
        categoria: string;
        quantidade: number;
        descricao: string | null;
    }[];
    agendamento: {
        id: number;
        data_hora: string;
        tipo: 'coleta' | 'entrega';
        status: 'confirmado' | 'alteracao_sugerida';
        data_hora_sugerida: string | null;
        endereco_referencia: string | null;
    } | null;
    criado_em: string;
    avaliacao: { nota: number; descricao: string } | null;
};

type ItemRecebido = {
    categoria_id: number;
    categoria: string;
    quantidade: number;
};

type Props = {
    doacoes: Doacao[];
    itens_recebidos: ItemRecebido[];
    horarios: Horario[];
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
    nao_entregue: {
        label: 'Não entregue',
        icon: PackageX,
        variant: 'destructive',
    },
    cancelado: { label: 'Cancelada', icon: Ban, variant: 'secondary' },
    recusada: { label: 'Recusada', icon: XCircle, variant: 'destructive' },
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDataHora(iso: string) {
    const d = new Date(iso);

    return `${DIAS[d.getDay()]}, ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function iniciais(nome: string) {
    return nome
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');
}

function StarPicker({
    value,
    onChange,
}: {
    value: number;
    onChange: (n: number) => void;
}) {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        className={`size-7 ${
                            n <= (hovered || value)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

function DoacaoCard({
    doacao,
    horarios,
}: {
    doacao: Doacao;
    horarios: Horario[];
}) {
    const [processing, setProcessing] = useState(false);
    const [nota, setNota] = useState(5);
    const [descricao, setDescricao] = useState('');
    const [avaliarOpen, setAvaliarOpen] = useState(false);

    function post(url: string) {
        setProcessing(true);
        router.post(url, {}, { onFinish: () => setProcessing(false) });
    }

    function handleAvaliar() {
        setProcessing(true);
        router.post(
            avaliarRoute(doacao.id).url,
            { nota, descricao: descricao || null },
            {
                onFinish: () => {
                    setProcessing(false);
                    setAvaliarOpen(false);
                },
            },
        );
    }

    const cfg = statusConfig[doacao.status];
    const temSugestao = doacao.agendamento?.status === 'alteracao_sugerida';

    return (
        <Card>
            <CardHeader className="">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2">
                        <Link
                            href={`/instituicao/doadores/${doacao.doador.usuario_id}`}
                            className="flex items-center gap-2 transition-colors hover:text-primary"
                        >
                            <Avatar className="size-10 border">
                                {fotoUrl(doacao.doador.foto_perfil) && (
                                    <AvatarImage
                                        src={fotoUrl(doacao.doador.foto_perfil)}
                                        alt={doacao.doador.nome}
                                    />
                                )}
                                <AvatarFallback className="text-sm font-semibold">
                                    {iniciais(doacao.doador.nome) || (
                                        <User className="size-4 shrink-0 text-muted-foreground" />
                                    )}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium underline-offset-2 hover:underline">
                                {doacao.doador.nome}
                            </span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {doacao.doador.telefone}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant={cfg.variant} className="gap-1 text-xs">
                            <cfg.icon className="size-3" />
                            {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {new Date(doacao.criado_em).toLocaleDateString(
                                'pt-BR',
                            )}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Package className="size-3.5 text-muted-foreground" />
                        Itens
                    </div>
                    <ul className="flex flex-col gap-1 pl-5">
                        {doacao.itens.map((item) => (
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
                </div>

                {doacao.agendamento && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Calendar className="size-3.5 text-muted-foreground" />
                            Agendamento
                        </div>
                        <div className="flex flex-col gap-1 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        doacao.agendamento.tipo === 'coleta'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="text-xs"
                                >
                                    {doacao.agendamento.tipo === 'coleta'
                                        ? 'Coleta'
                                        : 'Entrega'}
                                </Badge>
                                <span>
                                    {formatDataHora(
                                        doacao.agendamento.data_hora,
                                    )}
                                </span>
                            </div>
                            {doacao.agendamento.endereco_referencia && (
                                <span className="text-xs text-muted-foreground">
                                    Endereço:{' '}
                                    {doacao.agendamento.endereco_referencia}
                                </span>
                            )}
                            {temSugestao &&
                                doacao.agendamento.data_hora_sugerida && (
                                    <p className="mt-1 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
                                        Alteração sugerida para{' '}
                                        <strong>
                                            {formatDataHora(
                                                doacao.agendamento
                                                    .data_hora_sugerida,
                                            )}
                                        </strong>{' '}
                                        — aguardando resposta do doador.
                                    </p>
                                )}
                        </div>
                    </div>
                )}
            </CardContent>

            {doacao.status === 'pendente' && !temSugestao && (
                <>
                    <Separator />
                    <CardFooter className="flex flex-col gap-3 pt-4">
                        <div className="flex w-full gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                                onClick={() => post(rejectRoute(doacao.id).url)}
                                disabled={processing}
                            >
                                <X className="size-4" /> Recusar
                            </Button>
                            <Button
                                className="flex-1 gap-1.5"
                                onClick={() =>
                                    post(confirmRoute(doacao.id).url)
                                }
                                disabled={processing}
                            >
                                <Check className="size-4" /> Confirmar
                            </Button>
                        </div>
                        {doacao.agendamento && (
                            <SugerirAlteracaoDialog
                                agendamentoId={doacao.agendamento.id}
                                dataHoraAtual={doacao.agendamento.data_hora}
                                tipo={doacao.agendamento.tipo}
                                horarios={horarios}
                                trigger={
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-1.5"
                                    >
                                        <CalendarClock className="size-3.5" />
                                        Sugerir outra data
                                    </Button>
                                }
                            />
                        )}
                    </CardFooter>
                </>
            )}

            {doacao.status === 'confirmada' && (
                <>
                    <Separator />
                    <CardFooter className="flex flex-col gap-3 pt-4">
                        <div className="flex w-full gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                                onClick={() =>
                                    post(notDeliveredRoute(doacao.id).url)
                                }
                                disabled={processing}
                            >
                                <X className="size-4" /> Não entregue
                            </Button>
                            <Button
                                className="flex-1 gap-1.5"
                                onClick={() =>
                                    post(deliverRoute(doacao.id).url)
                                }
                                disabled={processing}
                            >
                                <CheckCheck className="size-4" /> Entregue
                            </Button>
                        </div>
                        {doacao.agendamento && (
                            <SugerirAlteracaoDialog
                                agendamentoId={doacao.agendamento.id}
                                dataHoraAtual={doacao.agendamento.data_hora}
                                tipo={doacao.agendamento.tipo}
                                horarios={horarios}
                                trigger={
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-1.5"
                                    >
                                        <CalendarClock className="size-3.5" />
                                        Sugerir outra data
                                    </Button>
                                }
                            />
                        )}
                    </CardFooter>
                </>
            )}

            {doacao.status === 'entregue' && (
                <>
                    <Separator />
                    <CardFooter className="pt-4">
                        {doacao.avaliacao ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <StarDisplay nota={doacao.avaliacao.nota} />
                                <span>{doacao.avaliacao.descricao}</span>
                            </div>
                        ) : (
                            <Dialog
                                open={avaliarOpen}
                                onOpenChange={setAvaliarOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                    >
                                        <Star className="size-3.5" />
                                        Avaliar doador
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>Avaliar doador</DialogTitle>
                                    <DialogDescription>
                                        Avalie a experiência com{' '}
                                        <span className="font-medium text-foreground">
                                            {doacao.doador.nome}
                                        </span>{' '}
                                        nesta doação.
                                    </DialogDescription>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-center py-1">
                                            <StarPicker
                                                value={nota}
                                                onChange={(n) => {
                                                    setNota(n);
                                                    setDescricao('');
                                                }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium">
                                                Descrição{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </label>
                                            <Textarea
                                                placeholder="Descreva a experiência com o doador. Esta descrição será visível para outros usuários."
                                                value={descricao}
                                                onChange={(e) =>
                                                    setDescricao(e.target.value)
                                                }
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                setAvaliarOpen(false)
                                            }
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            disabled={processing || !descricao}
                                            onClick={handleAvaliar}
                                        >
                                            {processing
                                                ? 'Enviando...'
                                                : 'Confirmar avaliação'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
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
    items: Doacao[];
    horarios: Horario[];
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
                        <DoacaoCard doacao={x} horarios={horarios} />
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

export default function InstituicaoDoacoes({
    doacoes,
    itens_recebidos,
    horarios,
}: Props) {
    const pendentes = doacoes.filter((d) => d.status === 'pendente');
    const confirmadas = doacoes.filter((d) => d.status === 'confirmada');
    const historico = doacoes.filter(
        (d) => !['pendente', 'confirmada'].includes(d.status),
    );

    const totalAtivas = pendentes.length + confirmadas.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Doações" />
            <div className="flex flex-col gap-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                            Doações
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {totalAtivas > 0
                                ? `${pendentes.length} pendente${pendentes.length !== 1 ? 's' : ''} · ${confirmadas.length} confirmada${confirmadas.length !== 1 ? 's' : ''}`
                                : 'Nenhuma solicitação ativa no momento.'}
                        </p>
                    </div>
                    <ItensDialog
                        label="Itens disponíveis"
                        title="Itens disponíveis"
                        description="Itens recebidos disponíveis para transferência."
                        grupos={[
                            {
                                vazio: 'Nenhum item disponível.',
                                itens: itens_recebidos,
                            },
                        ]}
                        footer={
                            itens_recebidos.length > 0 && (
                                <Link
                                    href="/instituicoes"
                                    className="inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                                >
                                    <ArrowLeftRight className="size-3.5" />
                                    Transferir itens
                                </Link>
                            )
                        }
                    />
                </div>
                <div className="flex flex-col gap-6">
                    {doacoes.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                            Nenhuma solicitação de doação recebida ainda.
                        </div>
                    ) : (
                        <div className="flex min-w-0 flex-col gap-10">
                            <Section
                                title="Pendentes"
                                icon={Clock}
                                items={pendentes}
                                horarios={horarios}
                            />
                            <Section
                                title="Confirmadas"
                                icon={CheckCircle2}
                                items={confirmadas}
                                horarios={horarios}
                            />
                            <Section
                                title="Histórico"
                                icon={History}
                                items={historico}
                                horarios={horarios}
                                collapsed
                            />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
