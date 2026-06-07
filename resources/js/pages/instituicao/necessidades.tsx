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

export default function Index({ categorias, necessidades, necessidades_count, tem_horarios }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Minhas Necessidades" />

            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-semibold">
                            Minhas Necessidades
                        </h1>
                        <span className="text-muted-foreground text-sm">
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

                {!tem_horarios && (
                    <div className="border-pending/30 bg-pending/10 rounded-lg border px-4 py-3 text-sm">
                        Cadastre ao menos um{' '}
                        <Link href="/instituicao/horarios" className="font-medium underline">
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
                    <div className="text-muted-foreground border border-dashed rounded-xl py-16 text-center">
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