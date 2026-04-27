import { Head, router } from '@inertiajs/react';
import { Calendar, Check, CheckCheck, Package, Phone, User, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { painel } from '@/routes/instituicao';
import {
    confirm as confirmRoute,
    deliver as deliverRoute,
    index as doacoesIndex,
    reject as rejectRoute,
} from '@/routes/instituicao/doacoes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: painel.url() },
    { title: 'Doações', href: doacoesIndex.url() },
];

// ─── types ────────────────────────────────────────────────────────────────────

type StatusKey = 'pendente' | 'confirmada' | 'entregue' | 'cancelado' | 'recusada';

type Doacao = {
    id: number;
    status: StatusKey;
    doador: { nome: string; telefone: string };
    itens: { id: number; categoria: string; quantidade: number; descricao: string | null }[];
    agendamento: {
        data_hora: string;
        tipo: 'coleta' | 'entrega';
        endereco_referencia: string | null;
    } | null;
    criado_em: string;
};

type Props = { doacoes: Doacao[] };

// ─── status config ────────────────────────────────────────────────────────────

const statusConfig: Record<StatusKey, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pendente:   { label: 'Pendente',    variant: 'outline' },
    confirmada: { label: 'Confirmada',  variant: 'default' },
    entregue:   { label: 'Entregue',    variant: 'secondary' },
    cancelado:  { label: 'Cancelada',   variant: 'secondary' },
    recusada:   { label: 'Recusada',    variant: 'destructive' },
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDataHora(iso: string) {
    const d = new Date(iso);

    return `${DIAS[d.getDay()]}, ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── card ─────────────────────────────────────────────────────────────────────

function DoacaoCard({ doacao }: { doacao: Doacao }) {
    const [processing, setProcessing] = useState(false);

    function post(url: string) {
        setProcessing(true);
        router.post(url, {}, { onFinish: () => setProcessing(false) });
    }

    const cfg = statusConfig[doacao.status];

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <User className="text-muted-foreground size-4 shrink-0" />
                            <span className="font-medium">{doacao.doador.nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="text-muted-foreground size-3.5 shrink-0" />
                            <span className="text-muted-foreground text-sm">{doacao.doador.telefone}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                        <span className="text-muted-foreground text-xs">
                            {new Date(doacao.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 pt-4">
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

                {doacao.agendamento && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Calendar className="text-muted-foreground size-3.5" />
                            Agendamento
                        </div>
                        <div className="bg-muted/40 flex flex-col gap-1 rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={doacao.agendamento.tipo === 'coleta' ? 'default' : 'secondary'}
                                    className="text-xs"
                                >
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

            {/* actions — only for actionable statuses */}
            {doacao.status === 'pendente' && (
                <>
                    <Separator />
                    <CardFooter className="gap-2 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                            onClick={() => post(rejectRoute(doacao.id).url)}
                            disabled={processing}
                        >
                            <X className="size-4" />
                            Recusar
                        </Button>
                        <Button
                            className="flex-1 gap-1.5"
                            onClick={() => post(confirmRoute(doacao.id).url)}
                            disabled={processing}
                        >
                            <Check className="size-4" />
                            Confirmar
                        </Button>
                    </CardFooter>
                </>
            )}

            {doacao.status === 'confirmada' && (
                <>
                    <Separator />
                    <CardFooter className="pt-4">
                        <Button
                            className="w-full gap-1.5"
                            onClick={() => post(deliverRoute(doacao.id).url)}
                            disabled={processing}
                        >
                            <CheckCheck className="size-4" />
                            Marcar como entregue
                        </Button>
                    </CardFooter>
                </>
            )}
        </Card>
    );
}

// ─── section ─────────────────────────────────────────────────────────────────

function Section({ title, items }: { title: string; items: Doacao[] }) {
    if (items.length === 0) {
return null;
}

    return (
        <section className="flex flex-col gap-3">
            <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
                {title} ({items.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((d) => <DoacaoCard key={d.id} doacao={d} />)}
            </div>
        </section>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function InstituicaoDoacoes({ doacoes }: Props) {
    const pendentes   = doacoes.filter((d) => d.status === 'pendente');
    const confirmadas = doacoes.filter((d) => d.status === 'confirmada');
    const historico   = doacoes.filter((d) => !['pendente', 'confirmada'].includes(d.status));

    const totalAtivas = pendentes.length + confirmadas.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Doações" />

            <div className="flex flex-col gap-8 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">Doações</h1>
                    <p className="text-muted-foreground text-sm">
                        {totalAtivas > 0
                            ? `${pendentes.length} pendente${pendentes.length !== 1 ? 's' : ''} · ${confirmadas.length} confirmada${confirmadas.length !== 1 ? 's' : ''}`
                            : 'Nenhuma solicitação ativa no momento.'}
                    </p>
                </div>

                {doacoes.length === 0 ? (
                    <div className="text-muted-foreground rounded-xl border border-dashed py-16 text-center text-sm">
                        Nenhuma solicitação de doação recebida ainda.
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        <Section title="Pendentes" items={pendentes} />
                        <Section title="Confirmadas" items={confirmadas} />
                        <Section title="Histórico" items={historico} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
