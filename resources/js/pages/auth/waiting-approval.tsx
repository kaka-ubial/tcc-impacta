import { Head, router, Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function WaitingApproval() {
    function handleRefresh() {
        router.visit('/redirect', {preserveScroll: true});
    }

    useEffect(() => { 
        const interval = setInterval(() => {
            handleRefresh(); 
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-6">
            <Head title="Aguardando aprovação" />

            <div className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm space-y-6">
                
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-8 w-8 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-semibold">
                        Conta em análise
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sua instituição foi cadastrada com sucesso.
                        Agora estamos analisando seus dados.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Você será liberado assim que um administrador aprovar sua conta.
                    </p>
                </div>

                <div className="flex justify-center">
                    <Spinner />
                </div>

                <div className="flex flex-col gap-2">
                    <Button asChild variant="outline">
                        <Link href="/settings/profile">
                            Visualizar Perfil
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}