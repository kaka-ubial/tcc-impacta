import { Head } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import Heading from '@/components/heading';
import { InstitutionModal } from '@/components/institution-modal';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Instituicao } from '@/types/instituicao';

interface Props {
    instituicoes: Instituicao[];
    stats: {
        pending: number;
        approved: number;
        rejected: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instituições Pendentes',
        href: '/admin/institutions',
    },
];

export default function InstitutionsList({ instituicoes, stats }: Props) {
    const [selectedInst, setSelectedInst] = useState<Instituicao | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Instituições Pendentes" />
            <div>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Heading
                        title="Fila de Validação"
                        description="Revise novos cadastros de instituição e regule a plataforma."
                    />
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatCard title="Instituições Pendentes" value={stats.pending} />
                        <StatCard title="Aprovadas" value={stats.approved} />
                        <StatCard title="Rejeitadas" value={stats.rejected} />
                    </div>
                </div>
                <div className="grid gap-4 p-4">
                    <DataTable
                        data={instituicoes}
                        emptyMessage="Nenhuma instituição aguardando validação."
                        columns={[
                            {
                                label: 'Instituição',
                                render: (inst) => (
                                    <div>
                                        <p className="font-medium">{inst.nome_fantasia}</p>
                                        <p className="text-xs text-muted-foreground">
                                            ID: {inst.usuario_id}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                label: 'CNPJ',
                                render: (inst) => inst.cnpj,
                            },
                            {
                                label: 'Telefone',
                                render: (inst) => inst.telefone,
                            },
                            {
                                label: 'Status',
                                render: () => (
                                    <Badge
                                        variant="outline"
                                        className="border-pending/40 bg-pending/10 text-pending font-medium"
                                    >
                                        Pendente
                                    </Badge>
                                ),
                            },
                            {
                                label: 'Analisar',
                                render: (inst) => (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedInst(inst)}
                                    >
                                        <Eye className="size-4" />
                                    </Button>
                                ),
                            },
                        ]}
                    />
                </div>
            </div>
            {selectedInst && (
                <InstitutionModal
                    institution={selectedInst}
                    isOpen={true}
                    onClose={() => setSelectedInst(null)}
                />
            )}
        </AppLayout>
    );
}
