import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { InstitutionModal } from '@/components/institution-modal';
import type { Instituicao } from '@/types/instituicao';
import Heading from '@/components/heading';
import { StatCard } from '@/components/stat-card';
import { DataTable } from '@/components/data-table';
import { Check, X, Eye } from 'lucide-react';

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

    function checkDetails(inst: Instituicao) {
        setSelectedInst(inst);
    }

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
                        {instituicoes.length > 0 ? (
                            <DataTable
                                data={instituicoes}
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
                                            <span className="text-yellow-500 font-medium">
                                                ● Pendente
                                            </span>
                                        ),
                                    },
                                    {
                                        label: 'Analisar',
                                        render: (inst) => (
                                            <div className="flex gap-2">
                                                <button onClick={() => checkDetails(inst)} className="text-blue-600 px-4">
                                                    <Eye size={16} />
                                                </button>
                                        </div>
                                        ),
                                    },
                                ]}
                            />
                        ) : (
                            <p className="col-span-3 text-center text-muted-foreground py-10">
                                Nenhuma instituição aguardando validação.
                            </p>
                        )}
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