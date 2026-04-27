import { Head, router, Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    motivo ?: string;
}

export default function Rejected({motivo}: Props) {
   
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-6">
            <Head title="Conta rejeitada" />

            <div className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm space-y-6">
                
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <X className="h-8 w-8 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-semibold">
                        Conta rejeitada
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Você poderá fazer novas tentativas de cadastro após corrigir as informações:
                    </p>
                    <p className="text-sm font-semibold">{motivo}</p>
                </div>

                <div className="flex flex-col gap-2">
                    <Button asChild variant="outline">
                        <Link href="/settings/profile">
                            Alterar Informações 
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}