import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { NecessidadeCard } from '@/components/necessidade-card';
import { NecessidadeCreateModal } from '@/components/necessidade-modal';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: '/instituicao/painel' },
    { title: 'Necessidades', href: '/instituicao/necessidades' },
];

type Props = {
    categorias: any[];
    necessidades: any[];
    necessidades_count: number;
    tem_horarios: boolean;
};

export default function Index({
    categorias,
    necessidades,
    necessidades_count,
    tem_horarios,
}: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Minhas Necessidades" />

            <div className="flex flex-col gap-6 p-6">
                <div className="full-bleed -mt-6 border-b border-border bg-card py-8">
                    <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-10 sm:px-12">
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-semibold">
                                Minhas Necessidades
                            </h1>
                            <span className="text-sm text-muted-foreground">
                                {necessidades_count} cadastradas
                            </span>
                        </div>

                        <Button
                            disabled={!tem_horarios}
                            onClick={() => {
                                setEditing(null);
                                setOpen(true);
                            }}
                        >
                            Nova necessidade
                        </Button>
                    </div>
                </div>

                {!tem_horarios && (
                    <div className="rounded-lg border border-pending/30 bg-pending/10 px-4 py-3 text-sm">
                        Cadastre ao menos um{' '}
                        <Link
                            href="/instituicao/horarios"
                            className="font-medium underline"
                        >
                            horário disponível
                        </Link>{' '}
                        antes de criar necessidades.
                    </div>
                )}

                <NecessidadeCreateModal
                    categorias={categorias}
                    open={open}
                    setOpen={setOpen}
                    initialData={editing}
                />

                {necessidades.length === 0 ? (
                    <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                        Nenhuma necessidade cadastrada ainda.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {necessidades.map((n) => (
                            <NecessidadeCard
                                key={n.id}
                                necessidade={n}
                                variant="instituicao"
                                onEdit={() => {
                                    setEditing(n);
                                    setOpen(true);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
