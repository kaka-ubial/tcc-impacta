import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MapPin, Package, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { CausaBadge } from '@/components/causa-badge';
import { VerificadaBadge } from '@/components/verificada-badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { index as instituicoesIndex, show as instituicoesShow } from '@/routes/instituicoes';
import type { BreadcrumbItem, InstituicaoListItem, SimplePaginated } from '@/types';

type Props = {
    instituicoes: SimplePaginated<InstituicaoListItem>;
    filters: { search: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Instituições', href: instituicoesIndex() },
];

export default function InstituicoesIndex({ instituicoes, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    const handleSearch = useCallback((value: string) => {
        setSearch(value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            router.get(
                instituicoesIndex(),
                value ? { search: value } : {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['instituicoes', 'filters'],
                },
            );
        }, 300);
    }, []);

    const hasPagination = instituicoes.prev_page_url !== null || instituicoes.next_page_url !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Instituições" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">Instituições</h1>
                    <p className="text-muted-foreground text-sm">
                        Encontre instituições e veja suas necessidades ativas.
                    </p>
                </div>

                <div className="relative max-w-sm">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        placeholder="Buscar por nome..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                {instituicoes.data.length === 0 ? (
                    <p className="text-muted-foreground py-12 text-center text-sm">
                        Nenhuma instituição encontrada.
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {instituicoes.data.map((inst) => (
                            <Link
                                key={inst.usuario_id}
                                href={instituicoesShow(inst.usuario_id)}
                                className="group"
                            >
                                <Card className="h-full transition-shadow group-hover:shadow-md">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-1.5 text-base leading-snug">
                                            <span>{inst.nome_fantasia}</span>
                                            <VerificadaBadge verificada={inst.verificada} />
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="flex flex-col gap-3">
                                        <div className="text-muted-foreground flex items-start gap-1.5 text-sm">
                                            <MapPin className="mt-0.5 size-4 shrink-0" />
                                            <span className="line-clamp-2">{inst.endereco_completo}</span>
                                        </div>

                                        {inst.causas.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {inst.causas.map((causa) => (
                                                    <CausaBadge key={causa.id} causa={causa} />
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter className="pt-0">
                                        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                            <Package className="size-4" />
                                            <span>
                                                {inst.necessidades_ativas_count}{' '}
                                                {inst.necessidades_ativas_count === 1
                                                    ? 'necessidade ativa'
                                                    : 'necessidades ativas'}
                                            </span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {hasPagination && (
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
                                <span className="text-muted-foreground px-3 py-2 text-sm">
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
                )}
            </div>
        </AppLayout>
    );
}
