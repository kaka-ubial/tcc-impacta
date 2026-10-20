import { useForm } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { update as updatePerfil } from '@/routes/instituicao/perfil';
import type { Causa } from '@/types';

export function PerfilCausasDialog({
    open,
    onClose,
    todasCausas,
    selecionadas,
}: {
    open: boolean;
    onClose: () => void;
    todasCausas: Causa[];
    selecionadas: number[];
}) {
    const {
        data,
        setData,
        setDefaults,
        patch,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({ causas: selecionadas });

    function handleOpenChange(next: boolean) {
        if (!next) {
            reset();
            clearErrors();
            onClose();
        }
    }

    function toggle(id: number) {
        setData(
            'causas',
            data.causas.includes(id)
                ? data.causas.filter((c) => c !== id)
                : [...data.causas, id],
        );
    }

    function salvar() {
        patch(updatePerfil().url, {
            preserveScroll: true,
            onSuccess: () => {
                setDefaults();
                onClose();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Causas da instituição</DialogTitle>
                    <DialogDescription>
                        As causas ajudam a recomendar sua instituição para
                        doadores com os mesmos interesses.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-2">
                    {todasCausas.map((causa) => {
                        const isSelected = data.causas.includes(causa.id);

                        return (
                            <button
                                key={causa.id}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => toggle(causa.id)}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-all duration-150',
                                    isSelected
                                        ? 'border-brand bg-brand/8 text-brand'
                                        : 'border-border bg-card text-muted-foreground hover:border-brand/30 hover:text-foreground',
                                )}
                            >
                                <span
                                    className={cn(
                                        'size-3.5 shrink-0 rounded-full border-2 transition-colors duration-150',
                                        isSelected
                                            ? 'border-brand bg-brand'
                                            : 'border-muted-foreground/30',
                                    )}
                                />
                                {causa.nome}
                            </button>
                        );
                    })}
                </div>
                <InputError message={errors.causas} />

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={salvar} disabled={processing}>
                        Salvar causas
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
