import { Head, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import { layout as salvarLayout } from '@/routes/instituicao/estatisticas';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: '/instituicao/painel' },
    { title: 'Estatísticas', href: '/instituicao/estatisticas' },
];

type Periodo = '30d' | '90d' | '12m' | 'todo';

const periodos: { value: Periodo; label: string }[] = [
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: '12m', label: '12 meses' },
    { value: 'todo', label: 'Todo o período' },
];

type ResumoTransferencias = Record<string, number>;

type Estatisticas = {
    periodo: Periodo;
    doacoes: {
        total: number;
        pendentes: number;
        confirmadas: number;
        entregues: number;
        canceladas: number;
        recusadas: number;
        nao_entregues: number;
        taxa_conclusao: number | null;
    };
    serie: {
        rotulo: string;
        solicitadas: number;
        entregues: number;
        canceladas: number;
    }[];
    doadores: { unicos: number; primeira_vez: number; recorrentes: number };
    itens_por_categoria: { categoria: string; quantidade: number }[];
    transferencias: {
        enviadas: ResumoTransferencias;
        recebidas: ResumoTransferencias;
        itens_enviados: number;
        itens_recebidos: number;
    };
    avaliacoes: {
        total: number;
        media: number | null;
        distribuicao: Record<string, number>;
        percentual_avaliadas: number | null;
    };
};

const pct = (v: number | null) => (v === null ? '—' : `${v}%`);

// Cores do tema (claro/escuro/daltônico). O vermelho vem de --chart-danger
// porque o --destructive do modo escuro é escuro demais para linhas e barras.
const COR = {
    marca: 'var(--brand)',
    verde: 'var(--success)',
    neutra: 'var(--chart-neutral)',
    vermelha: 'var(--chart-danger)',
};

const eixo = {
    tick: { fontSize: 12, fill: 'var(--muted-foreground)' },
    axisLine: false,
    tickLine: false,
} as const;

const grade = (
    <CartesianGrid
        vertical={false}
        stroke="var(--border)"
        strokeDasharray="0"
    />
);

const tooltip = (
    <Tooltip
        cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
        contentStyle={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            fontSize: 13,
            color: 'var(--foreground)',
        }}
        labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
        itemStyle={{ color: 'var(--foreground)' }}
    />
);

const legenda = (
    <Legend
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }}
    />
);

function Resumo({
    itens,
}: {
    itens: { label: string; value: string | number }[];
}) {
    return (
        <div className="grid grid-cols-2 divide-border rounded-2xl border bg-card sm:grid-cols-4 sm:divide-x">
            {itens.map((i) => (
                <div key={i.label} className="px-5 py-4">
                    <p className="text-xs text-muted-foreground">{i.label}</p>
                    <p className="mt-1 text-xl font-semibold">{i.value}</p>
                </div>
            ))}
        </div>
    );
}

function ChartCard({
    title,
    description,
    empty,
    children,
}: {
    title: string;
    description?: string;
    empty: boolean;
    children: React.ReactElement;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {empty ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                        Sem dados no período.
                    </p>
                ) : (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            {children}
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Mesmos ids de EstatisticasInstituicaoService::WIDGETS
const WIDGETS = [
    'indicadores',
    'serie',
    'doadores',
    'itens_categoria',
    'avaliacoes',
    'transferencias',
] as const;

type WidgetId = (typeof WIDGETS)[number];

type Layout = {
    widgets: { id: WidgetId; visivel: boolean }[];
    periodo: Periodo;
};

const WIDGET_TITULOS: Record<WidgetId, string> = {
    indicadores: 'Indicadores de doações',
    serie: 'Doações ao longo do tempo',
    doadores: 'Resumo de doadores',
    itens_categoria: 'Itens por categoria',
    avaliacoes: 'Avaliações dos doadores',
    transferencias: 'Transferências',
};

// Os demais ocupam a largura inteira no desktop
const MEIA_LARGURA: WidgetId[] = ['itens_categoria', 'avaliacoes'];

const PADRAO: Layout = {
    widgets: WIDGETS.map((id) => ({ id, visivel: true })),
    periodo: '90d',
};

function PersonalizarSheet({
    salvo,
    rascunho,
    onChange,
}: {
    salvo: Layout;
    rascunho: Layout;
    onChange: (layout: Layout) => void;
}) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const mover = (i: number, delta: number) => {
        const widgets = [...rascunho.widgets];
        [widgets[i], widgets[i + delta]] = [widgets[i + delta], widgets[i]];
        onChange({ ...rascunho, widgets });
    };

    const alternar = (id: WidgetId, visivel: boolean) =>
        onChange({
            ...rascunho,
            widgets: rascunho.widgets.map((w) =>
                w.id === id ? { ...w, visivel } : w,
            ),
        });

    // Fechar sem salvar descarta o rascunho
    const mudarAberto = (aberto: boolean) => {
        if (!aberto) {
            onChange(salvo);
        }

        setOpen(aberto);
    };

    const salvar = () =>
        router.patch(salvarLayout().url, rascunho, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => setOpen(false),
        });

    return (
        <Sheet open={open} onOpenChange={mudarAberto}>
            <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                    <SlidersHorizontal className="size-3.5" />
                    Personalizar
                </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-sm">
                <SheetHeader className="pr-10">
                    <SheetTitle>Personalizar estatísticas</SheetTitle>
                    <SheetDescription>
                        Escolha quais blocos aparecem e em que ordem. A
                        pré-visualização é imediata; o layout vale para todos os
                        seus dispositivos depois de salvo.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
                    <ol className="flex flex-col gap-2">
                        {rascunho.widgets.map((w, i) => (
                            <li
                                key={w.id}
                                className="flex items-center gap-3 rounded-lg border px-3 py-2"
                            >
                                <Checkbox
                                    id={`widget-${w.id}`}
                                    checked={w.visivel}
                                    onCheckedChange={(c) =>
                                        alternar(w.id, c === true)
                                    }
                                />
                                <Label
                                    htmlFor={`widget-${w.id}`}
                                    className={`flex-1 text-sm ${w.visivel ? '' : 'text-muted-foreground'}`}
                                >
                                    {WIDGET_TITULOS[w.id]}
                                </Label>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    disabled={i === 0}
                                    aria-label={`Mover ${WIDGET_TITULOS[w.id]} para cima`}
                                    onClick={() => mover(i, -1)}
                                >
                                    <ArrowUp className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    disabled={i === rascunho.widgets.length - 1}
                                    aria-label={`Mover ${WIDGET_TITULOS[w.id]} para baixo`}
                                    onClick={() => mover(i, 1)}
                                >
                                    <ArrowDown className="size-4" />
                                </Button>
                            </li>
                        ))}
                    </ol>

                    <div className="flex flex-col gap-1.5">
                        <Label>Período padrão</Label>
                        <Select
                            value={rascunho.periodo}
                            onValueChange={(v) =>
                                onChange({ ...rascunho, periodo: v as Periodo })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {periodos.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Usado ao abrir a página.
                        </p>
                    </div>
                </div>

                <SheetFooter className="border-t">
                    <Button onClick={salvar} disabled={processing}>
                        {processing ? 'Salvando…' : 'Salvar layout'}
                    </Button>
                    <Button
                        variant="ghost"
                        className="gap-1.5"
                        onClick={() => onChange(PADRAO)}
                    >
                        <RotateCcw className="size-3.5" />
                        Restaurar padrão
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default function Estatisticas({
    estatisticas: e,
    layout,
}: {
    estatisticas: Estatisticas;
    layout: Layout;
}) {
    const isMobile = useIsMobile();
    const [rascunho, setRascunho] = useState(layout);
    const [salvo, setSalvo] = useState(layout);

    // Após salvar, o servidor devolve o layout normalizado
    if (layout !== salvo) {
        setSalvo(layout);
        setRascunho(layout);
    }

    const trocarPeriodo = (periodo: Periodo) =>
        router.get(
            '/instituicao/estatisticas',
            { periodo },
            { preserveScroll: true, preserveState: true },
        );

    const distribuicao = Object.entries(e.avaliacoes.distribuicao).map(
        ([nota, total]) => ({ nota: `${nota}★`, total }),
    );

    const transferenciasStatus = [
        ['pendente', 'Pendentes'],
        ['confirmada', 'Confirmadas'],
        ['entregue', 'Entregues'],
        ['recusada', 'Recusadas'],
        ['cancelada', 'Canceladas'],
        ['nao_entregue', 'Não entregues'],
    ].map(([chave, label]) => ({
        status: label,
        Enviadas: e.transferencias.enviadas[chave] ?? 0,
        Recebidas: e.transferencias.recebidas[chave] ?? 0,
    }));

    const widgets: Record<WidgetId, React.ReactNode> = {
        indicadores: (
            <section className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatCard
                        title="Doações concluídas"
                        value={e.doacoes.entregues}
                    />
                    <StatCard title="Solicitações" value={e.doacoes.total} />
                    <StatCard
                        title="Taxa de conclusão"
                        value={pct(e.doacoes.taxa_conclusao)}
                    />
                    <StatCard
                        title="Nota média dos doadores"
                        value={e.avaliacoes.media ?? '—'}
                    />
                </div>
                <Resumo
                    itens={[
                        {
                            label: 'Em andamento',
                            value: e.doacoes.pendentes + e.doacoes.confirmadas,
                        },
                        {
                            label: 'Canceladas pelo doador',
                            value: e.doacoes.canceladas,
                        },
                        { label: 'Recusadas', value: e.doacoes.recusadas },
                        {
                            label: 'Não entregues',
                            value: e.doacoes.nao_entregues,
                        },
                    ]}
                />
            </section>
        ),
        serie: (
            <ChartCard
                title="Doações ao longo do tempo"
                description="Solicitadas, entregues e canceladas por data de criação."
                empty={e.doacoes.total === 0}
            >
                <LineChart data={e.serie} margin={{ left: -20, top: 8 }}>
                    {grade}
                    <XAxis dataKey="rotulo" {...eixo} />
                    <YAxis allowDecimals={false} {...eixo} />
                    {tooltip}
                    {legenda}
                    <Line
                        type="linear"
                        dataKey="solicitadas"
                        name="Solicitadas"
                        stroke={COR.neutra}
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                    />
                    <Line
                        type="linear"
                        dataKey="entregues"
                        name="Entregues"
                        stroke={COR.marca}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                    />
                    <Line
                        type="linear"
                        dataKey="canceladas"
                        name="Canceladas"
                        stroke={COR.vermelha}
                        strokeWidth={2}
                        strokeDasharray="10 3 2 3"
                        dot={false}
                    />
                </LineChart>
            </ChartCard>
        ),
        doadores: (
            <Resumo
                itens={[
                    {
                        label: 'Doadores (com entrega)',
                        value: e.doadores.unicos,
                    },
                    {
                        label: 'Doadores de primeira vez',
                        value: e.doadores.primeira_vez,
                    },
                    {
                        label: 'Doadores recorrentes',
                        value: e.doadores.recorrentes,
                    },
                ]}
            />
        ),
        itens_categoria: (
            <ChartCard
                title="Itens recebidos por categoria"
                description="Quantidade nas doações entregues."
                empty={e.itens_por_categoria.length === 0}
            >
                <BarChart
                    data={e.itens_por_categoria}
                    layout="vertical"
                    margin={{ left: isMobile ? 0 : 8 }}
                >
                    <CartesianGrid horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" allowDecimals={false} {...eixo} />
                    <YAxis
                        type="category"
                        dataKey="categoria"
                        width={isMobile ? 84 : 110}
                        {...eixo}
                    />
                    {tooltip}
                    <Bar
                        dataKey="quantidade"
                        name="Itens"
                        fill={COR.marca}
                        radius={[0, 6, 6, 0]}
                        barSize={18}
                    />
                </BarChart>
            </ChartCard>
        ),
        avaliacoes: (
            <ChartCard
                title="Avaliações dos doadores"
                description={`${e.avaliacoes.total} avaliações · ${pct(e.avaliacoes.percentual_avaliadas)} das doações entregues avaliadas`}
                empty={e.avaliacoes.total === 0}
            >
                <BarChart data={distribuicao} margin={{ left: -20, top: 8 }}>
                    {grade}
                    <XAxis dataKey="nota" {...eixo} />
                    <YAxis allowDecimals={false} {...eixo} />
                    {tooltip}
                    <Bar
                        dataKey="total"
                        name="Avaliações"
                        fill={COR.marca}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                    />
                </BarChart>
            </ChartCard>
        ),
        transferencias: (
            <section className="flex flex-col gap-4">
                <Resumo
                    itens={[
                        {
                            label: 'Transferências enviadas',
                            value: e.transferencias.enviadas.total,
                        },
                        {
                            label: 'Transferências recebidas',
                            value: e.transferencias.recebidas.total,
                        },
                        {
                            label: 'Itens enviados (entregues)',
                            value: e.transferencias.itens_enviados,
                        },
                        {
                            label: 'Itens recebidos (entregues)',
                            value: e.transferencias.itens_recebidos,
                        },
                    ]}
                />
                <ChartCard
                    title="Transferências por status"
                    empty={
                        e.transferencias.enviadas.total +
                            e.transferencias.recebidas.total ===
                        0
                    }
                >
                    {/* No celular os 6 status não cabem no eixo X: barras deitadas */}
                    {isMobile ? (
                        <BarChart
                            data={transferenciasStatus}
                            layout="vertical"
                            margin={{ left: 0 }}
                        >
                            <CartesianGrid
                                horizontal={false}
                                stroke="var(--border)"
                            />
                            <XAxis
                                type="number"
                                allowDecimals={false}
                                {...eixo}
                            />
                            <YAxis
                                type="category"
                                dataKey="status"
                                width={92}
                                {...eixo}
                            />
                            {tooltip}
                            {legenda}
                            <Bar
                                dataKey="Enviadas"
                                fill={COR.marca}
                                radius={[0, 6, 6, 0]}
                                maxBarSize={12}
                            />
                            <Bar
                                dataKey="Recebidas"
                                fill={COR.verde}
                                radius={[0, 6, 6, 0]}
                                maxBarSize={12}
                            />
                        </BarChart>
                    ) : (
                        <BarChart
                            data={transferenciasStatus}
                            margin={{ left: -20, top: 8 }}
                        >
                            {grade}
                            <XAxis dataKey="status" {...eixo} />
                            <YAxis allowDecimals={false} {...eixo} />
                            {tooltip}
                            {legenda}
                            <Bar
                                dataKey="Enviadas"
                                fill={COR.marca}
                                radius={[6, 6, 0, 0]}
                                maxBarSize={32}
                            />
                            <Bar
                                dataKey="Recebidas"
                                fill={COR.verde}
                                radius={[6, 6, 0, 0]}
                                maxBarSize={32}
                            />
                        </BarChart>
                    )}
                </ChartCard>
            </section>
        ),
    };

    const visiveis = rascunho.widgets.filter((w) => w.visivel);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Estatísticas" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-bold">
                            Estatísticas
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Doações e transferências contadas pela data de
                            criação no período.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {periodos.map((p) => (
                            <Button
                                key={p.value}
                                size="sm"
                                variant={
                                    e.periodo === p.value
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() => trocarPeriodo(p.value)}
                            >
                                {p.label}
                            </Button>
                        ))}
                        <PersonalizarSheet
                            salvo={salvo}
                            rascunho={rascunho}
                            onChange={setRascunho}
                        />
                    </div>
                </div>

                {visiveis.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-16 text-center">
                        <p className="font-medium">Nenhum bloco visível</p>
                        <p className="text-sm text-muted-foreground">
                            Use “Personalizar” para escolher o que aparece aqui.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {visiveis.map((w) => (
                            <div
                                key={w.id}
                                className={`min-w-0 ${MEIA_LARGURA.includes(w.id) ? '' : 'lg:col-span-2'}`}
                            >
                                {widgets[w.id]}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
