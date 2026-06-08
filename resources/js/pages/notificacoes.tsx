import { Head } from '@inertiajs/react';
import { Bell } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Notificacao = {
    id: number;
    titulo: string;
    mensagem: string;
    lida: boolean;
    criado_em: string;
};

type Props = { notificacoes: Notificacao[] };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Notificações', href: '/notificacoes' },
];

function tempoRelativo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);

    if (min < 1) {
        return 'agora';
    }

    if (min < 60) {
        return `há ${min} min`;
    }

    const horas = Math.floor(min / 60);

    if (horas < 24) {
        return `há ${horas} h`;
    }

    const dias = Math.floor(horas / 24);

    if (dias < 7) {
        return `há ${dias} d`;
    }

    return new Date(iso).toLocaleDateString('pt-BR');
}

export default function Notificacoes({ notificacoes }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notificações" />

            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">Notificações</h1>
                    <p className="text-muted-foreground text-sm">
                        Atualizações das suas doações e agendamentos.
                    </p>
                </div>

                {notificacoes.length === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center text-sm">
                        <Bell className="size-8 opacity-40" />
                        Nenhuma notificação ainda.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {notificacoes.map((n) => (
                            <div
                                key={n.id}
                                className={`flex gap-3 rounded-lg border px-4 py-3 ${
                                    n.lida ? 'border-border' : 'border-primary/30 bg-primary/5'
                                }`}
                            >
                                <div
                                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                                        n.lida ? 'bg-transparent' : 'bg-primary'
                                    }`}
                                />
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <span className="font-medium">{n.titulo}</span>
                                        <span className="text-muted-foreground text-xs">
                                            {tempoRelativo(n.criado_em)}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-sm">{n.mensagem}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
