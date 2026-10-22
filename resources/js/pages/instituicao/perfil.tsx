import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    Clock,
    FileText,
    Heart,
    HeartHandshake,
    Mail,
    MapPin,
    Package,
    Phone,
    Users,
} from 'lucide-react';
import { CausaBadge } from '@/components/causa-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificadaBadge } from '@/components/verificada-badge';
import AppLayout from '@/layouts/app-layout';
import { fotoUrl } from '@/lib/foto';
import { DIAS } from '@/lib/horarios';
import { painel } from '@/routes/instituicao';
import { index as necessidadesIndex } from '@/routes/instituicao/necessidades';
import type { BreadcrumbItem, InstituicaoPerfil } from '@/types';

type Props = { instituicao: InstituicaoPerfil };

const prioridadeConfig: Record<
    string,
    { variant: 'destructive' | 'default' | 'secondary'; label: string }
> = {
    alta: { variant: 'destructive', label: 'Alta prioridade' },
    media: { variant: 'default', label: 'Média prioridade' },
    baixa: { variant: 'secondary', label: 'Baixa prioridade' },
};

function formatData(iso: string | null) {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Heart;
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
            </div>
            <div className="flex flex-col">
                <span className="text-2xl leading-none font-semibold">
                    {value}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
            </div>
        </div>
    );
}

export default function InstituicaoPerfilPage({ instituicao }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Painel', href: painel.url() },
        { title: 'Meu perfil', href: '/instituicao/perfil' },
    ];

    const foto = fotoUrl(instituicao.foto_perfil);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Meu perfil" />

            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar className="size-20 rounded-xl border">
                        {foto && (
                            <AvatarImage
                                src={foto}
                                alt={instituicao.nome_fantasia}
                            />
                        )}
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                            <Building2 className="size-8" />
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1">
                        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                            <h1 className="font-display text-2xl leading-tight font-bold md:text-3xl">
                                {instituicao.nome_fantasia}
                            </h1>
                            <VerificadaBadge
                                verificada={instituicao.verificada}
                                variant="full"
                            />
                        </div>
                        {instituicao.razao_social !==
                            instituicao.nome_fantasia && (
                            <p className="text-sm text-muted-foreground">
                                {instituicao.razao_social}
                            </p>
                        )}
                        {instituicao.membro_desde && (
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <CalendarDays className="size-3.5" />
                                Membro desde{' '}
                                {formatData(instituicao.membro_desde)}
                            </span>
                        )}
                        {instituicao.causas.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                                {instituicao.causas.map((causa) => (
                                    <CausaBadge key={causa.id} causa={causa} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={Heart}
                        label="Doações recebidas"
                        value={instituicao.estatisticas.total_doacoes}
                    />
                    <StatCard
                        icon={HeartHandshake}
                        label="Doações concluídas"
                        value={instituicao.estatisticas.doacoes_concluidas}
                    />
                    <StatCard
                        icon={Users}
                        label="Doadores atendidos"
                        value={instituicao.estatisticas.doadores_atendidos}
                    />
                    <StatCard
                        icon={Package}
                        label="Necessidades ativas"
                        value={instituicao.estatisticas.necessidades_ativas}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    <div className="flex flex-col gap-6 lg:col-span-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    Informações de contato
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3 text-sm">
                                <div className="flex items-center gap-2.5">
                                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="truncate">
                                        {instituicao.email}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                                    <span>{instituicao.telefone}</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                    <span>{instituicao.endereco_completo}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                                    <span>CNPJ {instituicao.cnpj}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    Horários de atendimento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2 text-sm">
                                {instituicao.horarios_disponiveis.length ===
                                0 ? (
                                    <p className="text-muted-foreground">
                                        Nenhum horário cadastrado.
                                    </p>
                                ) : (
                                    instituicao.horarios_disponiveis.map(
                                        (h) => (
                                            <div
                                                key={h.id}
                                                className="flex items-center justify-between gap-2"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Clock className="size-4 text-muted-foreground" />
                                                    {DIAS[h.dia_semana]}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {h.hora_inicio.slice(0, 5)}–
                                                    {h.hora_fim.slice(0, 5)} ·{' '}
                                                    {h.tipo}
                                                </span>
                                            </div>
                                        ),
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-3">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    Sobre
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                {instituicao.descricao ? (
                                    <p className="whitespace-pre-line">
                                        {instituicao.descricao}
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">
                                        Nenhuma descrição cadastrada.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="flex items-center gap-2 font-semibold">
                                    <Package className="size-4 text-muted-foreground" />
                                    Necessidades ativas
                                    <span className="text-sm font-normal text-muted-foreground">
                                        (
                                        {instituicao.necessidades_ativas.length}
                                        )
                                    </span>
                                </h2>
                                <Link
                                    href={necessidadesIndex()}
                                    className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                >
                                    Gerenciar
                                </Link>
                            </div>

                            {instituicao.necessidades_ativas.length === 0 ? (
                                <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                                    Você não tem necessidades ativas no momento.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {instituicao.necessidades_ativas.map(
                                        (n) => {
                                            const prioridade =
                                                prioridadeConfig[n.prioridade];

                                            return (
                                                <div
                                                    key={n.id}
                                                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                                                >
                                                    <div className="flex min-w-0 flex-col">
                                                        <span className="truncate text-sm font-medium">
                                                            {n.categoria.nome}
                                                        </span>
                                                        {n.descricao && (
                                                            <span className="truncate text-xs text-muted-foreground">
                                                                {n.descricao}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-3">
                                                        <span className="text-xs text-muted-foreground">
                                                            {n.quantidade_atual}
                                                            /
                                                            {
                                                                n.quantidade_objetivo
                                                            }
                                                        </span>
                                                        {prioridade && (
                                                            <Badge
                                                                variant={
                                                                    prioridade.variant
                                                                }
                                                            >
                                                                {
                                                                    prioridade.label
                                                                }
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
