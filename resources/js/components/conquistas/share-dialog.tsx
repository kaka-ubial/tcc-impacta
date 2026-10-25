import { router } from '@inertiajs/react';
import { Check, Copy, Link2, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Conquista } from '@/types';

type Props = { conquista: Conquista | null; onClose: () => void };

export function ShareDialog({ conquista, onClose }: Props) {
    const [copiado, setCopiado] = useState(false);
    const [processing, setProcessing] = useState(false);

    if (!conquista) {
        return null;
    }

    const url = conquista.url_compartilhamento;
    const texto = `Conquistei o badge "${conquista.nome}" ajudando quem precisa. Faça parte também!`;
    const enc = encodeURIComponent;

    const redes = url
        ? [
              {
                  nome: 'WhatsApp',
                  href: `https://wa.me/?text=${enc(`${texto} ${url}`)}`,
              },
              {
                  nome: 'X',
                  href: `https://twitter.com/intent/tweet?text=${enc(texto)}&url=${enc(url)}`,
              },
              {
                  nome: 'Facebook',
                  href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
              },
              {
                  nome: 'LinkedIn',
                  href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
              },
          ]
        : [];

    function acao(method: 'post' | 'delete') {
        setProcessing(true);
        router[method](
            `/conquistas/${conquista!.id}/compartilhar`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    async function copiar() {
        if (!url) {
            return;
        }

        try {
            await navigator.clipboard.writeText(url);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {
            // clipboard indisponível (http, permissão): o campo continua selecionável
        }
    }

    async function compartilharNativo() {
        if (!url) {
            return;
        }

        try {
            await navigator.share({ title: conquista!.nome, text: texto, url });
        } catch {
            // usuário cancelou o compartilhamento
        }
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Compartilhar conquista</DialogTitle>
                    <DialogDescription>{conquista.nome}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4">
                    {conquista.imagem_url && (
                        <img
                            src={conquista.imagem_url}
                            alt={conquista.nome}
                            className="size-28 object-contain"
                        />
                    )}

                    {!url ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-sm text-muted-foreground">
                                Ao compartilhar, criamos uma página pública para
                                este badge. Seu nome só aparece se você
                                autorizou em Configurações; caso contrário,
                                aparece "Um doador da plataforma".
                            </p>
                            <Button
                                onClick={() => acao('post')}
                                disabled={processing}
                                className="gap-1.5"
                            >
                                <Link2 className="size-4" />
                                Gerar link público
                            </Button>
                        </div>
                    ) : (
                        <div className="flex w-full flex-col gap-4">
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={url}
                                    onFocus={(e) => e.target.select()}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    aria-label="Copiar link"
                                    onClick={copiar}
                                >
                                    {copiado ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {redes.map((r) => (
                                    <Button
                                        key={r.nome}
                                        asChild
                                        variant="outline"
                                        size="sm"
                                    >
                                        <a
                                            href={r.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {r.nome}
                                        </a>
                                    </Button>
                                ))}
                            </div>

                            {typeof navigator !== 'undefined' &&
                                'share' in navigator && (
                                    <Button
                                        type="button"
                                        onClick={compartilharNativo}
                                        className="gap-1.5"
                                    >
                                        <Share2 className="size-4" />
                                        Compartilhar no aparelho
                                    </Button>
                                )}

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => acao('delete')}
                                disabled={processing}
                            >
                                Parar de compartilhar
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
