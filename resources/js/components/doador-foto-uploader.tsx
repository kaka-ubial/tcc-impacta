import { router } from '@inertiajs/react';
import { Camera, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { fotoUrl } from '@/lib/foto';

type Props = {
    nome: string;
    fotoAtual: string | null;
};

const MAX_BYTES = 2 * 1024 * 1024;
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

function iniciais(nome: string) {
    return nome
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('');
}

export function DoadorFotoUploader({ nome, fotoAtual }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [clientError, setClientError] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const fotoSrc = preview ?? fotoUrl(fotoAtual);

    function abrirSelecao() {
        setClientError(null);
        setServerError(null);
        inputRef.current?.click();
    }

    function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        if (!file) {
            return;
        }

        if (!TIPOS_ACEITOS.includes(file.type)) {
            setClientError('Formato inválido. Use JPG, PNG ou WEBP.');

            return;
        }

        if (file.size > MAX_BYTES) {
            setClientError('A imagem deve ter no máximo 2 MB.');

            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setProcessing(true);
        setServerError(null);

        router.post(
            '/settings/profile/foto',
            { foto: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (errs) => {
                    setServerError(errs.foto ?? 'Falha ao enviar a foto.');
                },
                onFinish: () => {
                    URL.revokeObjectURL(objectUrl);
                    setPreview(null);
                    setProcessing(false);

                    if (inputRef.current) {
                        inputRef.current.value = '';
                    }
                },
            },
        );
    }

    function remover() {
        setClientError(null);
        setServerError(null);
        router.delete('/settings/profile/foto', { preserveScroll: true });
    }

    const mostraErro = clientError ?? serverError;

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative">
                <Avatar className="size-20 border">
                    {fotoSrc && <AvatarImage src={fotoSrc} alt={nome} />}
                    <AvatarFallback className="text-lg font-semibold">
                        {iniciais(nome) || <Camera className="size-7" />}
                    </AvatarFallback>
                </Avatar>
                {processing && (
                    <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-full">
                        <Loader2 className="size-6 animate-spin" />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={abrirSelecao}
                        disabled={processing}
                        className="gap-1.5"
                    >
                        <Upload className="size-3.5" />
                        {fotoAtual ? 'Trocar foto' : 'Enviar foto'}
                    </Button>

                    {fotoAtual && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={remover}
                            disabled={processing}
                            className="text-destructive hover:text-destructive gap-1.5"
                        >
                            <Trash2 className="size-3.5" />
                            Remover
                        </Button>
                    )}
                </div>

                <p className="text-muted-foreground text-xs">
                    JPG, PNG ou WEBP · até 2 MB.
                </p>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onFileSelected}
                />

                {mostraErro && <InputError message={mostraErro} />}
            </div>
        </div>
    );
}
