import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Filter, MapPin, MapPinned, Navigation, Package, Search, Sparkles, Tag, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { CausaBadge } from '@/components/causa-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { VerificadaBadge } from '@/components/verificada-badge';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as instituicoesIndex, show as instituicoesShow } from '@/routes/instituicoes';
import { edit as editProfile } from '@/routes/profile';
import type { BreadcrumbItem, Causa, CategoriaItem, InstituicaoListItem, Recomendacao, SimplePaginated } from '@/types';

// Valor sentinela do Select para "sem filtro" — Radix Select não aceita value="".
const SEM_FILTRO = 'all';

type Filters = {
    search: string;
    causa: number | null;
    categoria: number | null;
    raio: number | null;
};

type Props = {
    instituicoes: SimplePaginated<InstituicaoListItem>;
    causas: Causa[];
    categorias: CategoriaItem[];
    hasLocation: boolean;
    filters: Filters;
    recomendacoes: Recomendacao[];
};

// Opções de raio do filtro de proximidade (RF4), em km.
const RAIO_OPTIONS = [5, 10, 25, 50, 100] as const;

function formatDistancia(km: number): string {
    return km < 1 ? 'menos de 1 km' : `${km} km`;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Instituições', href: instituicoesIndex() },
];

function CardSkeleton() {
    return (
        <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-col gap-3 p-5 pb-4">
                <Skeleton className="h-5 w-3/5" />
                <div className="flex items-center gap-1.5">
                    <Skeleton className="size-3 rounded-full shrink-0" />
                    <Skeleton className="h-3.5 w-4/5" />
                </div>
                <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </div>
            <div className="mt-auto border-t border-border px-5 py-3">
                <Skeleton className="h-3.5 w-2/5" />
            </div>
        </div>
    );
}

function RecommendationCard({ rec }: { rec: Recomendacao }) {
    return (
        <Link
            href={instituicoesShow(rec.usuario_id)}
            className="group flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-brand/30 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug text-foreground group-hover:text-brand transition-colors">
                    {rec.nome_fantasia}
                </h3>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            {rec.endereco_completo && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 size-3 shrink-0" />
                    <span className="line-clamp-1">{rec.endereco_completo}</span>
                </div>
            )}

            {rec.causas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {rec.causas.slice(0, 3).map((c) => (
                        <CausaBadge key={c.id} causa={c} />
                    ))}
                    {rec.causas.length > 3 && (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            +{rec.causas.length - 3}
                        </span>
                    )}
                </div>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                {rec.causa_overlap > 0 && (
                    <span className="font-medium text-success">
                        {rec.causa_overlap}{' '}
                        {rec.causa_overlap === 1 ? 'causa em comum' : 'causas em comum'}
                    </span>
                )}
                {rec.distancia_km !== null && (
                    <span>{formatDistancia(rec.distancia_km)}</span>
                )}
            </div>
        </Link>
    );
}

function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
    return (
        <div className="flex flex-col items-center gap-5 py-20 text-center">
            <svg
                width="72"
                height="72"
                viewBox="0 0 72 72"
                fill="none"
                aria-hidden
                className="text-muted-foreground/30"
            >
                <rect x="10" y="28" width="44" height="34" rx="6" stroke="currentColor" strokeWidth="2" />
                <path d="M10 40 Q32 47 54 40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
                <circle cx="52" cy="20" r="11" stroke="currentColor" strokeWidth="2" />
                <path d="M59.5 28L66 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M46 20h12M52 14v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
                <p className="font-semibold text-foreground">
                    {hasSearch ? 'Nenhuma instituição encontrada' : 'Nenhuma instituição cadastrada'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {hasSearch
                        ? 'Tente buscar por outro nome ou limpe o filtro.'
                        : 'Novas instituições serão listadas aqui assim que aprovadas.'}
                </p>
            </div>
            {hasSearch && (
                <Button variant="outline" size="sm" onClick={onClear}>
                    <X className="size-3.5" />
                    Limpar busca
                </Button>
            )}
        </div>
    );
}

export default function InstituicoesIndex({ instituicoes, causas, categorias, hasLocation, filters, recomendacoes }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [searching, setSearching] = useState(false);
    const [recsOpen, setRecsOpen] = useState(true);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    // Só liga o skeleton se a navegação realmente demorar — em requests
    // rápidas (localhost, cache) trocar a grade inteira por skeleton e
    // voltar em poucos ms lê como um "flicker" na tela.
    const searchingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Sincroniza o input quando o filtro muda via navegacao (padrao "adjust
    // state during render" — evita setState dentro de useEffect)
    const [prevFilterSearch, setPrevFilterSearch] = useState(filters.search);

    if (prevFilterSearch !== filters.search) {
        setPrevFilterSearch(filters.search);
        setSearch(filters.search);
        setSearching(false);
    }

    const navigate = useCallback((params: { search?: string; causa?: number | null; categoria?: number | null; raio?: number | null }) => {
        const merged = {
            search: params.search ?? filters.search,
            causa: params.causa !== undefined ? params.causa : filters.causa,
            categoria: params.categoria !== undefined ? params.categoria : filters.categoria,
            raio: params.raio !== undefined ? params.raio : filters.raio,
        };

        const query: Record<string, string> = {};

        if (merged.search) {
query.search = merged.search;
}

        if (merged.causa) {
query.causa = String(merged.causa);
}

        if (merged.categoria) {
query.categoria = String(merged.categoria);
}

        if (merged.raio) {
query.raio = String(merged.raio);
}

        clearTimeout(searchingTimer.current);
        searchingTimer.current = setTimeout(() => setSearching(true), 200);

        router.get(
            instituicoesIndex(),
            query,
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['instituicoes', 'filters'],
                onSuccess: () => {
                    clearTimeout(searchingTimer.current);
                    setSearching(false);
                },
                onError: () => {
                    clearTimeout(searchingTimer.current);
                    setSearching(false);
                },
            },
        );
    }, [filters.search, filters.causa, filters.categoria, filters.raio]);

    const handleSearch = useCallback((value: string) => {
        setSearch(value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => navigate({ search: value }), 300);
    }, [navigate]);

    const handleCausa = useCallback((id: number | null) => {
        navigate({ causa: id });
    }, [navigate]);

    const handleCategoria = useCallback((id: number | null) => {
        navigate({ categoria: id });
    }, [navigate]);

    const handleRaio = useCallback((km: number | null) => {
        navigate({ raio: km });
    }, [navigate]);

    const clearItemFilters = useCallback(() => {
        navigate({ categoria: null, raio: null });
    }, [navigate]);

    const clearAll = useCallback(() => {
        setSearch('');
        navigate({ search: '', causa: null, categoria: null, raio: null });
    }, [navigate]);

    const hasActiveFilters =
        filters.search !== '' || filters.causa !== null || filters.categoria !== null || filters.raio !== null;

    const itemFilterCount = (filters.categoria !== null ? 1 : 0) + (filters.raio !== null ? 1 : 0);

    const hasPagination =
        instituicoes.prev_page_url !== null || instituicoes.next_page_url !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Instituições" />

            <div className="flex flex-col gap-0">

                {/* ── Page header ─────────────────────────────── */}
                <div className="border-b border-border bg-card px-6 py-8">
                    <div className="mx-auto max-w-5xl">
                        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                            Instituições
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Encontre instituições verificadas e veja suas necessidades ativas.
                        </p>

                        {/* Search + filtro de item/proximidade */}
                        <div className="mt-5 flex max-w-lg items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome, cidade, causa..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {search && (
                                    <button
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => handleSearch('')}
                                        aria-label="Limpar busca"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="relative shrink-0" aria-label="Filtros">
                                        <Filter className="size-4" />
                                        {itemFilterCount > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-primary-foreground">
                                                {itemFilterCount}
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="w-72">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                <Package className="size-3.5" />
                                                Precisa de
                                            </p>
                                            <Select
                                                value={filters.categoria !== null ? String(filters.categoria) : SEM_FILTRO}
                                                onValueChange={(value) => handleCategoria(value === SEM_FILTRO ? null : Number(value))}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Qualquer item" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={SEM_FILTRO}>Qualquer item</SelectItem>
                                                    {categorias.map((categoria) => (
                                                        <SelectItem key={categoria.id} value={String(categoria.id)}>
                                                            {categoria.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                <Navigation className="size-3.5" />
                                                Proximidade
                                            </p>
                                            {hasLocation ? (
                                                <Select
                                                    value={filters.raio !== null ? String(filters.raio) : SEM_FILTRO}
                                                    onValueChange={(value) => handleRaio(value === SEM_FILTRO ? null : Number(value))}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Qualquer distância" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={SEM_FILTRO}>Qualquer distância</SelectItem>
                                                        {RAIO_OPTIONS.map((km) => (
                                                            <SelectItem key={km} value={String(km)}>
                                                                até {km} km
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                                    <MapPinned className="mt-0.5 size-3.5 shrink-0" />
                                                    <span>
                                                        <Link href={editProfile()} className="font-medium text-brand hover:underline">
                                                            Cadastre seu endereço
                                                        </Link>{' '}
                                                        para buscar perto de você.
                                                    </span>
                                                </p>
                                            )}
                                        </div>

                                        {itemFilterCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="self-start text-muted-foreground"
                                                onClick={clearItemFilters}
                                            >
                                                <X className="size-3.5" />
                                                Limpar filtros
                                            </Button>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-5xl px-6 py-6">

                    {/* ── Causa filter pills ───────────────────── */}
                    {causas.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                            <button
                                onClick={() => handleCausa(null)}
                                className={[
                                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                    filters.causa === null
                                        ? 'border-brand bg-brand text-primary-foreground'
                                        : 'border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground',
                                ].join(' ')}
                            >
                                Todas
                            </button>
                            {causas.map((causa) => (
                                <button
                                    key={causa.id}
                                    onClick={() => handleCausa(
                                        filters.causa === causa.id ? null : causa.id,
                                    )}
                                    className={[
                                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                        filters.causa === causa.id
                                            ? 'border-brand bg-brand text-primary-foreground'
                                            : 'border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground',
                                    ].join(' ')}
                                >
                                    <Tag className="size-3" />
                                    {causa.nome}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Recommendations ─────────────────────── */}
                    {!hasActiveFilters && (
                        recomendacoes.length > 0 ? (
                            <div className="mb-8">
                                <button
                                    type="button"
                                    onClick={() => setRecsOpen((o) => !o)}
                                    className="mb-4 flex w-full items-center justify-between gap-4 text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-semibold text-foreground">Recomendadas para você</h2>
                                    </div>
                                    <ChevronRight
                                        className={cn(
                                            'size-4 text-muted-foreground transition-transform duration-200',
                                            recsOpen ? 'rotate-90' : '',
                                        )}
                                    />
                                </button>

                                {recsOpen && (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {recomendacoes.map((rec) => (
                                            <RecommendationCard key={rec.usuario_id} rec={rec} />
                                        ))}
                                    </div>
                                )}

                                <div className="mt-6 border-t border-border pt-6">
                                    <h2 className="text-sm font-semibold text-foreground">Todas as instituições</h2>
                                </div>
                            </div>
                        ) : instituicoes.data.length > 0 ? (
                            <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
                                <Sparkles className="size-7 text-muted-foreground/40" />
                                <div>
                                    <p className="font-medium text-foreground">Nenhuma recomendação disponível</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Ainda não há instituições próximas a você.{' '}
                                        Explore a lista geral de instituições abaixo.
                                    </p>
                                </div>
                            </div>
                        ) : null
                    )}

                    {/* ── Content ─────────────────────────────── */}
                    {searching ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}
                        </div>
                    ) : instituicoes.data.length === 0 ? (
                        <EmptyState
                            hasSearch={hasActiveFilters}
                            onClear={clearAll}
                        />
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {instituicoes.data.map((inst) => (
                                <Link
                                    key={inst.usuario_id}
                                    href={instituicoesShow(inst.usuario_id)}
                                    className="group focus-visible:outline-none"
                                >
                                    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-brand/30 hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">

                                        {/* Card body */}
                                        <div className="flex flex-col gap-3 p-5 pb-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <h2 className="font-semibold leading-snug text-foreground group-hover:text-brand transition-colors">
                                                    {inst.nome_fantasia}
                                                </h2>
                                                <VerificadaBadge verificada={inst.verificada} />
                                            </div>

                                            {inst.endereco_completo && (
                                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                                    <MapPin className="mt-0.5 size-3 shrink-0" />
                                                    <span className="line-clamp-1">
                                                        {inst.endereco_completo}
                                                    </span>
                                                </div>
                                            )}

                                            {inst.distancia_km != null && (
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-brand">
                                                    <Navigation className="size-3 shrink-0" />
                                                    {formatDistancia(inst.distancia_km)}
                                                </div>
                                            )}

                                            {inst.causas.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {inst.causas.map((causa) => (
                                                        <CausaBadge key={causa.id} causa={causa} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Card footer */}
                                        <div className="mt-auto flex items-center justify-between border-t border-border px-5 py-3">
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Package className="size-3.5" />
                                                {inst.necessidades_ativas_count}{' '}
                                                {inst.necessidades_ativas_count === 1
                                                    ? 'necessidade ativa'
                                                    : 'necessidades ativas'}
                                            </span>
                                            <span className="flex items-center gap-0.5 text-xs font-medium text-brand opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                                Ver
                                                <ChevronRight className="size-3.5" />
                                            </span>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* ── Pagination ──────────────────────────── */}
                    {hasPagination && !searching && (
                        <div className="mt-8">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationLink
                                            href={instituicoes.prev_page_url ?? '#'}
                                            aria-disabled={!instituicoes.prev_page_url}
                                            className={!instituicoes.prev_page_url ? 'pointer-events-none opacity-40' : ''}
                                            size="default"
                                        >
                                            <ChevronLeft className="size-4" />
                                            <span className="hidden sm:block">Anterior</span>
                                        </PaginationLink>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-3 py-2 text-sm text-muted-foreground">
                                            Página {instituicoes.current_page}
                                        </span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink
                                            href={instituicoes.next_page_url ?? '#'}
                                            aria-disabled={!instituicoes.next_page_url}
                                            className={!instituicoes.next_page_url ? 'pointer-events-none opacity-40' : ''}
                                            size="default"
                                        >
                                            <span className="hidden sm:block">Próxima</span>
                                            <ChevronRight className="size-4" />
                                        </PaginationLink>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
