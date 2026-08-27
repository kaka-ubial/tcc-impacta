import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    CalendarDays,
    Heart,
    Mail,
    Package,
    Phone,
    Trophy,
    User as UserIcon,
} from 'lucide-react';
import { CausaBadge } from '@/components/causa-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StarDisplay } from '@/components/ui/star-display';
import AppLayout from '@/layouts/app-layout';
import { fotoUrl } from '@/lib/foto';
import type { BreadcrumbItem, DoadorPerfil } from '@/types';
import { index as doadorDoacoesIndex } from '@/routes/doacoes';
import { painel } from '@/routes/instituicao';
import { index as doacoesIndex } from '@/routes/instituicao/doacoes';

type Props = { doador: DoadorPerfil; isOwnProfile?: boolean };

function iniciais(nome: string) {
    return nome
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');
}

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
    icon: typeof Trophy;
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

function DoacaoLinha({ d }: { d: DoadorPerfil['doacoes_recentes'][number] }) {
    return (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
                <Link
                    href={`/instituicoes/${d.instituicao.usuario_id}`}
                    className="truncate text-sm font-medium underline-offset-2 hover:text-primary hover:underline"
                >
                    {d.instituicao.nome_fantasia}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                    {formatData(d.criado_em)}
                </span>
            </div>

            {d.itens.length > 0 && (
                <ul className="flex flex-wrap gap-x-3 gap-y-1 pl-1 text-xs text-muted-foreground">
                    {d.itens.map((item) => (
                        <li key={item.id}>
                            <span className="font-medium text-foreground">
                                {item.quantidade}×
                            </span>{' '}
                            {item.categoria}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function DoadorPerfilPage({
    doador,
    isOwnProfile = false,
}: Props) {
    if (typeof window !== 'undefined') {
        console.log('[DoadorPerfilPage]', {
            isOwnProfile,
            foto_perfil: doador.foto_perfil,
            resolved_url: fotoUrl(doador.foto_perfil),
        });
    }

    const breadcrumbs: BreadcrumbItem[] = isOwnProfile
        ? [
              { title: 'Minhas doações', href: doadorDoacoesIndex.url() },
              { title: 'Meu perfil', href: '/perfil' },
          ]
        : [
              { title: 'Painel', href: painel.url() },
              { title: 'Doações', href: doacoesIndex.url() },
              {
                  title: doador.nome_completo,
                  href: `/instituicao/doadores/${doador.usuario_id}`,
              },
          ];

    const voltarHref = isOwnProfile
        ? doadorDoacoesIndex.url()
        : doacoesIndex.url();
    const voltarLabel = isOwnProfile
        ? 'Voltar para minhas doações'
        : 'Voltar para doações';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isOwnProfile ? 'Meu perfil' : doador.nome_completo} />

            <div className="flex flex-col gap-8 p-6">
                {/* Hero */}
                <div className="full-bleed -mt-6 border-b border-border bg-card py-8">
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-10 sm:px-12">
                        <Link
                            href={voltarHref}
                            className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-3.5" />
                            {voltarLabel}
                        </Link>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Avatar className="size-20 border">
                                {fotoUrl(doador.foto_perfil) && (
                                    <AvatarImage
                                        src={fotoUrl(doador.foto_perfil)}
                                        alt={doador.nome_completo}
                                    />
                                )}
                                <AvatarFallback className="text-xl font-semibold">
                                    {iniciais(doador.nome_completo) || (
                                        <UserIcon className="size-8" />
                                    )}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col gap-1">
                                <h1 className="text-2xl leading-tight font-bold">
                                    {doador.nome_completo}
                                </h1>
                                {doador.estatisticas.media_avaliacoes !==
                                    null && (
                                    <div className="flex items-center gap-1 text-sm text-yellow-500">
                                        <StarDisplay
                                            nota={Math.round(
                                                doador.estatisticas
                                                    .media_avaliacoes,
                                            )}
                                        />{' '}
                                        ({doador.estatisticas.total_avaliacoes})
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                    {doador.membro_desde && (
                                        <span className="flex items-center gap-1.5">
                                            <CalendarDays className="size-3.5" />
                                            Membro desde{' '}
                                            {formatData(doador.membro_desde)}
                                        </span>
                                    )}
                                </div>
                                {doador.causas.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        {doador.causas.map((causa) => (
                                            <CausaBadge
                                                key={causa.id}
                                                causa={causa}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div
                    className={`grid gap-3 sm:grid-cols-2 ${isOwnProfile ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}
                >
                    <StatCard
                        icon={Heart}
                        label="Doações totais"
                        value={doador.estatisticas.total_doacoes}
                    />
                    <StatCard
                        icon={Award}
                        label="Doações concluídas"
                        value={doador.estatisticas.doacoes_concluidas}
                    />
                    {!isOwnProfile && (
                        <StatCard
                            icon={Package}
                            label="Doações para sua instituição"
                            value={doador.estatisticas.doacoes_com_instituicao}
                        />
                    )}
                    <StatCard
                        icon={Trophy}
                        label="Pontuação"
                        value={doador.pontuacao_gamificacao}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Sidebar */}
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
                                        {doador.email}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                                    <span>{doador.telefone}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Delivered donations */}
                    <div className="flex flex-col gap-3 lg:col-span-3">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Heart className="size-4 text-muted-foreground" />
                            Doações entregues
                            <span className="text-sm font-normal text-muted-foreground">
                                ({doador.doacoes_recentes.length})
                            </span>
                        </h2>

                        {doador.doacoes_recentes.length === 0 ? (
                            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                                {isOwnProfile
                                    ? 'Você ainda não teve doações entregues.'
                                    : 'Este doador ainda não teve doações entregues.'}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {doador.doacoes_recentes.map((d) => (
                                    <DoacaoLinha key={d.id} d={d} />
                                ))}
                            </div>
                        )}

                        <Separator className="my-2" />

                        <p className="text-xs text-muted-foreground">
                            Mostrando até 10 doações entregues mais recentes.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
