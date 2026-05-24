import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Check, CheckCheck, Package, Phone, Star, User, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fotoUrl } from '@/lib/foto';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: painel.url() },
    { title: 'Doações', href: doacoesIndex.url() },
];

// ─── types ────────────────────────────────────────────────────────────────────

type StatusKey = 'pendente' | 'confirmada' | 'entregue' | 'cancelado' | 'recusada' | 'nao_entregue';

type Doacao = {
    id: number;
    status: StatusKey;
    doador: { usuario_id: number; nome: string; telefone: string, foto_perfil: string | null };
    itens: { id: number; categoria: string; quantidade: number; descricao: string | null }[];
    agendamento: {
        data_hora: string;
        tipo: 'coleta' | 'entrega';
        endereco_referencia: string | null;
    } | null;
    criado_em: string;
    avaliacao: { nota: number } | null;
};

type Props = { doacoes: Doacao[] };

// ─── status config ────────────────────────────────────────────────────────────

const statusConfig: Record<StatusKey, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pendente:   { label: 'Pendente',      variant: 'outline' },
    confirmada: { label: 'Confirmada',    variant: 'default' },
    entregue:   { label: 'Entregue',      variant: 'secondary' },
    nao_entregue: { label: 'Não entregue', variant: 'destructive' },
    cancelado:  { label: 'Cancelada',     variant: 'secondary' },
    recusada:   { label: 'Recusada',      variant: 'destructive' },
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

// ─── star picker ─────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
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

// ─── card ─────────────────────────────────────────────────────────────────────

function DoacaoCard({ doacao }: { doacao: Doacao }) {
    const [processing, setProcessing] = useState(false);
    const [nota, setNota] = useState(5);
    const [descricao, setDescricao] = useState('');
    const [avaliarOpen, setAvaliarOpen] = useState(false);

    const descricaoObrigatoria = nota <= 3;
    const podeSalvar = !descricaoObrigatoria || descricao.trim().length > 0;

    function post(url: string) {
        setProcessing(true);
        router.post(url, {}, { onFinish: () => setProcessing(false) });
    }

    function handleAvaliar() {
        setProcessing(true);
        router.post(avaliarRoute(doacao.id).url, { nota, descricao: descricao || null }, {
            onFinish: () => { setProcessing(false); setAvaliarOpen(false); },
        });
    }

    const cfg = statusConfig[doacao.status];

    return (
        <Card>
            <CardHeader className="">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2">
                        <Link
                            href={`/instituicao/doadores/${doacao.doador.usuario_id}`}
                            className="hover:text-primary flex items-center gap-2 transition-colors"
                        >
                            <Avatar className="size-10 border">
                                {fotoUrl(doacao.doador.foto_perfil) && (
                                    <AvatarImage src={fotoUrl(doacao.doador.foto_perfil)} alt={doacao.doador.nome}   />
                                )}
                                <AvatarFallback className="text-sm font-semibold">
                                    {iniciais(doacao.doador.nome) || <User className="text-muted-foreground size-4 shrink-0" />}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium underline-offset-2 hover:underline">
                                {doacao.doador.nome}
                            </span>
                        </Link>
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

            <CardContent className="flex flex-col gap-4 ">
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
                        <div className="grid w-full gap-2 md:grid-cols-2">
                            <Button
                                className="w-full bg-destructive gap-1.5"
                                onClick={() => post(notDeliveredRoute(doacao.id).url)}
                                disabled={processing}
                            >
                                <X className="size-4" />
                                Não entregue
                            </Button>
                            <Button
                                className="w-full gap-1.5"
                                onClick={() => post(deliverRoute(doacao.id).url)}
                                disabled={processing}
                            >
                                <CheckCheck className="size-4" />
                                Entregue
                            </Button>
                        </div>
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
                                <span>Avaliação registrada</span>
                            </div>
                        ) : (
                            <Dialog open={avaliarOpen} onOpenChange={setAvaliarOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5">
                                        <Star className="size-3.5" />
                                        Avaliar doador
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>Avaliar doador</DialogTitle>
                                    <DialogDescription>
                                        Avalie a experiência com{' '}
                                        <span className="font-medium text-foreground">{doacao.doador.nome}</span>{' '}
                                        nesta doação.
                                    </DialogDescription>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-center py-1">
                                            <StarPicker
                                                value={nota}
                                                onChange={(n) => { setNota(n); if (n > 3) setDescricao(''); }}
                                            />
                                        </div>
                                        {descricaoObrigatoria && (
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium">
                                                    Descreva o problema <span className="text-destructive">*</span>
                                                </label>
                                                <Textarea
                                                    placeholder="O que aconteceu com esta doação?"
                                                    value={descricao}
                                                    onChange={(e) => setDescricao(e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter className="gap-2">
                                        <Button variant="secondary" onClick={() => setAvaliarOpen(false)}>
                                            Cancelar
                                        </Button>
                                        <Button disabled={processing || !podeSalvar} onClick={handleAvaliar}>
                                            {processing ? 'Enviando...' : 'Confirmar avaliação'}
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
