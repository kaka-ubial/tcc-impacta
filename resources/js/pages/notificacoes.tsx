import { Head, Link, router } from '@inertiajs/react';
import { Bell, Check, CheckCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { tempoRelativo } from '@/lib/tempo';
import { abrir, lida, lidas } from '@/routes/notificacoes';
import type { BreadcrumbItem } from '@/types';

type Notificacao = {
    id: number;
    titulo: string;
    mensagem: string;
    url: string | null;
    lida: boolean;
    criado_em: string;
};

type Props = { notificacoes: Notificacao[] };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Notificações', href: '/notificacoes' },
];

export default function Notificacoes({ notificacoes }: Props) {
    const naoLidas = notificacoes.filter((n) => !n.lida).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notificações" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Notificações</h1>
                        <p className="text-sm text-muted-foreground">
                            Atualizações das suas doações e agendamentos.
                        </p>
                    </div>
                    {naoLidas > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                router.post(
                                    lidas().url,
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            <CheckCheck aria-hidden="true" />
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>

                {notificacoes.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                        <Bell className="size-8 opacity-40" />
                        Nenhuma notificação ainda.
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {notificacoes.map((n) => (
                            <li
                                key={n.id}
                                className={`flex items-start gap-1 rounded-lg border ${
                                    n.lida
                                        ? 'border-border'
                                        : 'border-primary/40 bg-primary/10'
                                }`}
                            >
                                <Link
                                    href={abrir(n.id).url}
                                    className="flex min-w-0 flex-1 gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-accent/60 focus-visible:outline-2"
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                                            n.lida
                                                ? 'bg-transparent'
                                                : 'bg-primary'
                                        }`}
                                    />
                                    <span className="flex flex-col gap-0.5">
                                        <span className="flex flex-wrap items-baseline gap-2">
                                            <span className="font-medium">
                                                {n.titulo}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {tempoRelativo(n.criado_em)}
                                            </span>
                                            {!n.lida && (
                                                <span className="sr-only">
                                                    (não lida)
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {n.mensagem}
                                        </span>
                                    </span>
                                </Link>
                                {!n.lida && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="mt-2 mr-2 size-8 shrink-0"
                                        aria-label={`Marcar "${n.titulo}" como lida`}
                                        title="Marcar como lida"
                                        onClick={() =>
                                            router.patch(
                                                lida(n.id).url,
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Check aria-hidden="true" />
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
