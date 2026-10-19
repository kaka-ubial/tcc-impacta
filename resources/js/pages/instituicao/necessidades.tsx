import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { HorariosCard } from '@/components/horarios-card';
import { NecessidadeCard } from '@/components/necessidade-card';
import { NecessidadeCreateModal } from '@/components/necessidade-modal';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, HorarioDisponivel } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: '/instituicao/painel' },
    { title: 'Necessidades', href: '/instituicao/necessidades' },
];

type Props = {
    categorias: any[];
    necessidades: any[];
    necessidades_count: number;
    tem_horarios: boolean;
    horarios: HorarioDisponivel[];
};

export default function Index({
    categorias,
    necessidades,
    necessidades_count,
    tem_horarios,
    horarios,
}: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Minhas Necessidades" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
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

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
                    <div className="flex flex-col gap-4 lg:order-1">
                        {!tem_horarios && (
                            <p className="text-sm text-muted-foreground">
                                Adicione ao menos um horário disponível para
                                poder criar necessidades.
                            </p>
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
                            <div className="grid gap-4 md:grid-cols-2">
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

                    <aside className="lg:sticky lg:top-4 lg:order-2">
                        <HorariosCard horarios={horarios} />
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
