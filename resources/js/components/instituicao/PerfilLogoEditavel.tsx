import { Camera } from 'lucide-react';
import { useState } from 'react';

import { FotoPerfilUploader } from '@/components/foto-perfil-uploader';
import { InstituicaoLogo } from '@/components/instituicao/InstituicaoLogo';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function PerfilLogoEditavel({
    foto,
    nome,
}: {
    foto: string | null;
    nome: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={foto ? 'Trocar logo' : 'Enviar logo'}
                title={foto ? 'Trocar logo' : 'Enviar logo'}
                className="group relative shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <InstituicaoLogo foto={foto} nome={nome} tamanho="lg" />
                <span className="absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors group-hover:text-foreground">
                    <Camera className="size-3.5" aria-hidden="true" />
                </span>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Logo da instituição</DialogTitle>
                        <DialogDescription>
                            Aparece no seu perfil e na lista de instituições.
                            Prefira uma imagem quadrada com fundo claro.
                        </DialogDescription>
                    </DialogHeader>
                    <FotoPerfilUploader
                        variante="logo"
                        nome={nome}
                        fotoAtual={foto}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
