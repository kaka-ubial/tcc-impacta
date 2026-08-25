import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import type { BreadcrumbItem, SimplePaginated } from '@/types';
import type { AdminUser } from '@/types/admin-user';

interface Props {
    usuarios: SimplePaginated<AdminUser>;
    filtros: { tipo_usuario?: string; status?: string };
    tipo_options: string[];
    status_options: string[];
    stats: {
        ativo: number;
        suspenso: number;
        aguardando_validacao: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usuários', href: admin.users.index() },
];

const TIPO_LABELS: Record<string, string> = {
    doador: 'Doador',
    instituicao: 'Instituição',
    admin: 'Admin',
};

const STATUS_LABELS: Record<string, string> = {
    ativo: 'Ativo',
    suspenso: 'Suspenso',
    aguardando_validacao: 'Aguardando validação',
};

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        ativo: 'border-success/40 bg-success/10 text-success',
        suspenso: 'border-destructive/40 bg-destructive/10 text-destructive',
        aguardando_validacao: 'border-pending/40 bg-pending/10 text-pending',
    };

    return (
        <Badge
            variant="outline"
            className={`font-medium ${styles[status] ?? ''}`}
        >
            {STATUS_LABELS[status] ?? status}
        </Badge>
    );
}

export default function UsersList({
    usuarios,
    filtros,
    tipo_options,
    status_options,
    stats,
}: Props) {
    const navigate = (params: { tipo_usuario?: string; status?: string }) => {
        const merged = {
            tipo_usuario:
                params.tipo_usuario !== undefined
                    ? params.tipo_usuario
                    : filtros.tipo_usuario,
            status:
                params.status !== undefined ? params.status : filtros.status,
        };

        const query: Record<string, string> = {};

        if (merged.tipo_usuario) {
            query.tipo_usuario = merged.tipo_usuario;
        }

        if (merged.status) {
            query.status = merged.status;
        }

        router.get(admin.users.index().url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const hasPagination =
        usuarios.prev_page_url !== null || usuarios.next_page_url !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuários" />
            <div>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Heading
                        title="Gestão de Usuários"
                        description="Visualize, edite e gerencie o status de doadores e instituições cadastrados."
                    />
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatCard title="Ativos" value={stats.ativo} />
                        <StatCard title="Suspensos" value={stats.suspenso} />
                        <StatCard
                            title="Aguardando validação"
                            value={stats.aguardando_validacao}
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Select
                            value={filtros.tipo_usuario ?? 'all'}
                            onValueChange={(v) =>
                                navigate({ tipo_usuario: v === 'all' ? '' : v })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tipo de usuário" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Todos os tipos
                                </SelectItem>
                                {tipo_options.map((tipo) => (
                                    <SelectItem key={tipo} value={tipo}>
                                        {TIPO_LABELS[tipo] ?? tipo}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filtros.status ?? 'all'}
                            onValueChange={(v) =>
                                navigate({ status: v === 'all' ? '' : v })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Todos os status
                                </SelectItem>
                                {status_options.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {STATUS_LABELS[status] ?? status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 p-4">
                    <DataTable
                        data={usuarios.data}
                        emptyMessage="Nenhum usuário encontrado para os filtros selecionados."
                        columns={[
                            {
                                label: 'Nome',
                                render: (u) => (
                                    <div>
                                        <p className="font-medium">
                                            {u.nome ?? '—'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {u.email}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                label: 'Tipo',
                                render: (u) =>
                                    TIPO_LABELS[u.tipo_usuario] ??
                                    u.tipo_usuario,
                            },
                            {
                                label: 'Status',
                                render: (u) => (
                                    <StatusBadge status={u.status} />
                                ),
                            },
                            {
                                label: 'Ações',
                                render: (u) => (
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={admin.users.show(u.id)}>
                                            <Pencil className="size-4" />
                                        </Link>
                                    </Button>
                                ),
                            },
                        ]}
                    />

                    {hasPagination && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationLink
                                        href={usuarios.prev_page_url ?? '#'}
                                        aria-disabled={!usuarios.prev_page_url}
                                        className={
                                            !usuarios.prev_page_url
                                                ? 'pointer-events-none opacity-40'
                                                : ''
                                        }
                                        size="default"
                                    >
                                        <ChevronLeft className="size-4" />
                                        <span className="hidden sm:block">
                                            Anterior
                                        </span>
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="px-3 py-2 text-sm text-muted-foreground">
                                        Página {usuarios.current_page}
                                    </span>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink
                                        href={usuarios.next_page_url ?? '#'}
                                        aria-disabled={!usuarios.next_page_url}
                                        className={
                                            !usuarios.next_page_url
                                                ? 'pointer-events-none opacity-40'
                                                : ''
                                        }
                                        size="default"
                                    >
                                        <span className="hidden sm:block">
                                            Próxima
                                        </span>
                                        <ChevronRight className="size-4" />
                                    </PaginationLink>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
