import { Head, router } from '@inertiajs/react';
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
import AppLayout from '@/layouts/app-layout';
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

// Cores do tema (claro/escuro). O vermelho é fixo porque o --destructive
// do modo escuro é escuro demais para linhas e barras.
const COR = {
    marca: 'var(--brand)',
    verde: 'var(--success)',
    neutra: 'var(--muted-foreground)',
    vermelha: 'oklch(0.63 0.2 27)',
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

export default function Estatisticas({
    estatisticas: e,
}: {
    estatisticas: Estatisticas;
}) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Estatísticas" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
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
                    </div>
                </div>

                <section className="flex flex-col gap-3">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Doações concluídas"
                            value={e.doacoes.entregues}
                        />
                        <StatCard
                            title="Solicitações"
                            value={e.doacoes.total}
                        />
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
                                value:
                                    e.doacoes.pendentes + e.doacoes.confirmadas,
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
                            dot={false}
                        />
                    </LineChart>
                </ChartCard>

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

                <div className="grid gap-6 lg:grid-cols-2">
                    <ChartCard
                        title="Itens recebidos por categoria"
                        description="Quantidade nas doações entregues."
                        empty={e.itens_por_categoria.length === 0}
                    >
                        <BarChart
                            data={e.itens_por_categoria}
                            layout="vertical"
                            margin={{ left: 8 }}
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
                                dataKey="categoria"
                                width={110}
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

                    <ChartCard
                        title="Avaliações dos doadores"
                        description={`${e.avaliacoes.total} avaliações · ${pct(e.avaliacoes.percentual_avaliadas)} das doações entregues avaliadas`}
                        empty={e.avaliacoes.total === 0}
                    >
                        <BarChart
                            data={distribuicao}
                            margin={{ left: -20, top: 8 }}
                        >
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
                </div>

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
                    </ChartCard>
                </section>
            </div>
        </AppLayout>
    );
}
