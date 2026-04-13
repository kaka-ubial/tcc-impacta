import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, FileText, Heart, MapPin, Package, Phone, HandHeart } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';

import { CausaBadge } from '@/components/causa-badge';
import { DoacaoNecessidadesModal } from '@/components/doacao/DoacaoNecessidadesModal';
import { SolicitacaoDoacaoModal } from '@/components/doacao/SolicitacaoDoacaoModal';
import { VerificadaBadge } from '@/components/verificada-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { index as instituicoesIndex, show as instituicoesShow } from '@/routes/instituicoes';
import type { BreadcrumbItem, CategoriaItem, InstituicaoDetalhe } from '@/types';

const MapEmbed = lazy(() => import('@/components/map-embed'));

type Props = {
    instituicao: InstituicaoDetalhe;
    categorias: CategoriaItem[];
};

const prioridadeConfig: Record<string, { variant: 'destructive' | 'default' | 'secondary'; label: string }> = {
    alta:  { variant: 'destructive', label: 'Alta prioridade' },
    media: { variant: 'default',     label: 'Média prioridade' },
    baixa: { variant: 'secondary',   label: 'Baixa prioridade' },
};

function MapSection({ lat, lng, label }: { lat: number; lng: number; label: string }) {
    
    const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

    return (
        <div className="isolate overflow-hidden rounded-xl border shadow-sm">
            <div className="h-80">
                <Suspense fallback={<div className="bg-muted h-full w-full animate-pulse" />}>
                    <MapEmbed lat={lat} lng={lng} label={label} />
                </Suspense>
            </div>
            <div className="bg-muted/40 flex items-center justify-between px-3 py-2 text-xs">
                <span className="text-muted-foreground">{label}</span>
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                >
                    Abrir no mapa ↗
                </a>
            </div>
        </div>
    );
}

function NecessidadeCard({
    n,
    onAtender,
}: {
    n: InstituicaoDetalhe['necessidades_ativas'][number];
    onAtender: () => void;
}) {
    const pct = Math.min(100, Math.round((n.quantidade_atual / n.quantidade_objetivo) * 100));
    const cfg = prioridadeConfig[n.prioridade];
    const isFull = n.quantidade_atual >= n.quantidade_objetivo;

    return (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-snug">{n.categoria.nome}</span>
                <Badge variant={cfg.variant} className="shrink-0 text-xs">
                    {cfg.label}
                </Badge>
            </div>

            {n.descricao && (
                <p className="text-muted-foreground text-sm">{n.descricao}</p>
            )}

            <div className="flex flex-col gap-1">
                <div className="text-muted-foreground flex justify-between text-xs">
                    <span>{pct}% atendido</span>
                    <span>{n.quantidade_atual} / {n.quantidade_objetivo} unidades</span>
                </div>
                <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                    <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {!isFull && (
                <Button size="sm" variant="outline" className="mt-1 gap-1.5 self-end" onClick={onAtender}>
                    <HandHeart className="size-3.5" />
                    Atender necessidade
                </Button>
            )}
        </div>
    );
}

export default function InstituicaoShow({ instituicao, categorias }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [necessidadeModalId, setNecessidadeModalId] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Instituições', href: instituicoesIndex() },
        { title: instituicao.nome_fantasia, href: instituicoesShow(instituicao.usuario_id) },
    ];

    const hasMap = instituicao.latitude !== null && instituicao.longitude !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={instituicao.nome_fantasia} />

            <div className="flex flex-col gap-8 p-6">

                {/* Hero */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-2">
                        <Link
                            href={instituicoesIndex()}
                            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm transition-colors"
                        >
                            <ArrowLeft className="size-3.5" />
                            Voltar para lista
                        </Link>

                        <div className="flex items-center gap-3 mt-3">
                            <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl">
                                <Building2 className="size-6" />
                            </div>
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                                     <h1 className="text-2xl font-bold leading-tight">
                                        {instituicao.nome_fantasia}
                                     </h1>
                                     <VerificadaBadge verificada={instituicao.verificada} variant="full" />
                            </div>
                        </div>

                        <div>
                                  {instituicao.razao_social !== instituicao.nome_fantasia && (
                                    <p className="text-muted-foreground text-sm">
                                        {instituicao.razao_social}
                                    </p>
                                )}
                        </div>

                        {instituicao.causas.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {instituicao.causas.map((causa) => (
                                    <CausaBadge key={causa.id} causa={causa} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:mt-8 sm:flex-row">
                        <Button size="lg" className="gap-2" onClick={() => setModalOpen(true)}>
                            <Heart className="size-4" />
                            Quero Doar
                        </Button>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-5">

                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    Informações de contato
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3 text-sm">
                                <div className="flex items-start gap-2.5">
                                    <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                    <span>{instituicao.endereco_completo}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Phone className="text-muted-foreground size-4 shrink-0" />
                                    <span>{instituicao.telefone}</span>
                                </div>
                                <Separator />
                                <div className="text-muted-foreground text-xs">
                                    CNPJ: {instituicao.cnpj}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-3">

                        {instituicao.descricao && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        <FileText className="size-4" />
                                        Sobre a instituição
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-relaxed whitespace-pre-line">
                                        {instituicao.descricao}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex flex-col gap-3">
                            <h2 className="flex items-center gap-2 font-semibold">
                                <Package className="text-muted-foreground size-4" />
                                Necessidades ativas
                                <span className="text-muted-foreground font-normal text-sm">
                                    ({instituicao.necessidades_ativas.length})
                                </span>
                            </h2>

                            {instituicao.necessidades_ativas.length === 0 ? (
                                <div className="text-muted-foreground rounded-xl border border-dashed px-6 py-10 text-center text-sm">
                                    Nenhuma necessidade ativa no momento.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {instituicao.necessidades_ativas.map((n) => (
                                        <NecessidadeCard key={n.id} n={n} onAtender={() => setNecessidadeModalId(n.id)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <SolicitacaoDoacaoModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    instituicaoId={instituicao.usuario_id}
                    categorias={categorias}
                    horariosDisponiveis={instituicao.horarios_disponiveis}
                />

                <DoacaoNecessidadesModal
                    open={necessidadeModalId !== null}
                    onClose={() => setNecessidadeModalId(null)}
                    instituicaoId={instituicao.usuario_id}
                    necessidades={instituicao.necessidades_ativas}
                    horariosDisponiveis={instituicao.horarios_disponiveis}
                    initialNecessidadeId={necessidadeModalId ?? undefined}
                />

                {/* Mapa — largura total */}
                {hasMap && (
                    <MapSection
                        lat={instituicao.latitude!}
                        lng={instituicao.longitude!}
                        label={instituicao.endereco_completo}
                    />
                )}
            </div>
        </AppLayout>
    );
}
