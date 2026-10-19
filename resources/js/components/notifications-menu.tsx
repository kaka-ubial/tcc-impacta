import { Link, router, usePage } from '@inertiajs/react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { tempoRelativo } from '@/lib/tempo';
import { abrir, index, lida, lidas } from '@/routes/notificacoes';

type NotificacaoRecente = {
    id: number;
    titulo: string;
    mensagem: string;
    url: string | null;
    criado_em: string;
};

export function NotificationsMenu() {
    const { notificacoes_nao_lidas, notificacoes_recentes } = usePage()
        .props as unknown as {
        notificacoes_nao_lidas: number;
        notificacoes_recentes: NotificacaoRecente[];
    };
    const [aberto, setAberto] = useState(false);
    const total = notificacoes_nao_lidas ?? 0;
    const recentes = notificacoes_recentes ?? [];

    const rotulo =
        total > 0
            ? `Notificações, ${total} não ${total === 1 ? 'lida' : 'lidas'}`
            : 'Notificações';

    return (
        <Popover open={aberto} onOpenChange={setAberto}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-9 rounded-full"
                    aria-label={rotulo}
                >
                    <Bell aria-hidden="true" />
                    {total > 0 && (
                        <span
                            aria-hidden="true"
                            className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] leading-4 font-semibold text-white"
                        >
                            {total > 9 ? '9+' : total}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-96 max-w-[calc(100vw-2rem)] gap-0 p-0"
                aria-label="Notificações"
            >
                <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                    <h2 className="text-sm font-semibold">Notificações</h2>
                    {total > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 px-2 text-xs"
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

                {recentes.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
                        <Bell
                            className="size-7 opacity-40"
                            aria-hidden="true"
                        />
                        Você está em dia! Nenhuma notificação nova.
                    </div>
                ) : (
                    <ul className="max-h-96 divide-y overflow-y-auto">
                        {recentes.map((n) => (
                            <li key={n.id} className="flex items-start gap-1">
                                <Link
                                    href={abrir(n.id).url}
                                    className="flex min-w-0 flex-1 gap-3 px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                                    onClick={() => setAberto(false)}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                                    />
                                    <span className="flex min-w-0 flex-col gap-0.5">
                                        <span className="flex flex-wrap items-baseline gap-x-2">
                                            <span className="text-sm font-medium">
                                                {n.titulo}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {tempoRelativo(n.criado_em)}
                                            </span>
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {n.mensagem}
                                        </span>
                                    </span>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mt-2 mr-2 size-7 shrink-0"
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
                            </li>
                        ))}
                    </ul>
                )}

                <div className="border-t p-1">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setAberto(false)}
                    >
                        <Link href={index()}>Ver todas as notificações</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
