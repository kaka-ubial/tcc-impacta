import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export type ItensGrupo = {
    titulo?: string;
    vazio: string;
    itens: { categoria: string; quantidade: number }[];
};

type Props = {
    label: string;
    title: string;
    description: string;
    grupos: ItensGrupo[];
    footer?: React.ReactNode;
};

export function ItensDialog({
    label,
    title,
    description,
    grupos,
    footer,
}: Props) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                    <Package className="size-4" />
                    {label}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto pr-1">
                    {grupos.map((g, i) => (
                        <div
                            key={g.titulo ?? i}
                            className="flex flex-col gap-2"
                        >
                            {g.titulo && (
                                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    {g.titulo}
                                </h3>
                            )}
                            {g.itens.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {g.vazio}
                                </p>
                            ) : (
                                <ul className="flex flex-col divide-y rounded-lg border text-sm">
                                    {g.itens.map((item) => (
                                        <li
                                            key={item.categoria}
                                            className="flex items-center justify-between px-3 py-2"
                                        >
                                            <span>{item.categoria}</span>
                                            <span className="font-semibold">
                                                {item.quantidade}×
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>

                {footer}
            </DialogContent>
        </Dialog>
    );
}
