import { Head, Link } from '@inertiajs/react';
import { SearchX, ServerCrash, Clock, WifiOff, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    status: number;
}

const config: Record<number, { title: string; description: string; icon: React.ElementType }> = {
    403: {
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        icon: ShieldOff,
    },
    404: {
        title: 'Página não encontrada',
        description: 'A página que você está procurando não existe ou foi removida.',
        icon: SearchX,
    },
    500: {
        title: 'Erro interno',
        description: 'Algo deu errado no servidor. Tente novamente em breve.',
        icon: ServerCrash,
    },
    503: {
        title: 'Serviço indisponível',
        description: 'O serviço está temporariamente fora do ar. Voltamos em breve.',
        icon: WifiOff,
    },
    419: {
        title: 'Sessão expirada',
        description: 'Sua sessão expirou. Por favor, atualize a página e faça login novamente.',
        icon: Clock,
    },
};

export default function Error({ status }: Props) {
    const { title, description, icon: Icon } = config[status] ?? {
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        icon: ServerCrash,
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-warm-neutral p-6">
            <Head title={title} />

            <div className="w-full max-w-sm text-center">
                <div className="relative mb-8 flex justify-center">
                    <span
                        aria-hidden
                        className="font-display pointer-events-none select-none text-[9rem] font-bold leading-none text-brand/[0.08]"
                    >
                        {status}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft">
                            <Icon className="h-8 w-8 text-brand" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="font-display text-2xl font-bold text-foreground">
                        {title}
                    </h1>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button asChild>
                        <Link href="/">Voltar ao início</Link>
                    </Button>
                    <Button variant="ghost" onClick={() => window.history.back()}>
                        Página anterior
                    </Button>
                </div>
            </div>
        </div>
    );
}
