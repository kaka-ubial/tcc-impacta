import { useForm } from '@inertiajs/react';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DIAS, HORAS } from '@/lib/horarios';
import {
    destroy as destroyHorario,
    store as storeHorario,
} from '@/routes/instituicao/horarios';
import type { HorarioDisponivel } from '@/types';

function HorarioModal({
    open,
    setOpen,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            tipo: '',
            dia_semana: '',
            hora_inicio: '',
            hora_fim: '',
        });

    const fimInvalido =
        !!data.hora_inicio &&
        !!data.hora_fim &&
        data.hora_fim <= data.hora_inicio;
    const incompleto =
        !data.tipo || !data.dia_semana || !data.hora_inicio || !data.hora_fim;

    function handleOpenChange(next: boolean) {
        setOpen(next);

        if (!next) {
            reset();
            clearErrors();
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(storeHorario().url, {
            preserveScroll: true,
            onSuccess: () => handleOpenChange(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar horário disponível</DialogTitle>
                    <DialogDescription>
                        Informe quando você recebe doações ou faz coletas. Os
                        doadores agendam dentro desses horários.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="hor-tipo">Tipo</Label>
                        <Select
                            value={data.tipo}
                            onValueChange={(v) => setData('tipo', v)}
                        >
                            <SelectTrigger id="hor-tipo" className="w-full">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="entrega">
                                    Entrega (doador traz)
                                </SelectItem>
                                <SelectItem value="coleta">
                                    Coleta (buscamos no doador)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.tipo && (
                            <p className="text-xs text-destructive">
                                {errors.tipo}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="hor-dia">Dia da semana</Label>
                        <Select
                            value={data.dia_semana}
                            onValueChange={(v) => setData('dia_semana', v)}
                        >
                            <SelectTrigger id="hor-dia" className="w-full">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                {DIAS.map((d, i) => (
                                    <SelectItem key={d} value={String(i)}>
                                        {d}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.dia_semana && (
                            <p className="text-xs text-destructive">
                                {errors.dia_semana}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="hor-inicio">Início</Label>
                            <Select
                                value={data.hora_inicio}
                                onValueChange={(v) => setData('hora_inicio', v)}
                            >
                                <SelectTrigger
                                    id="hor-inicio"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="00:00" />
                                </SelectTrigger>
                                <SelectContent>
                                    {HORAS.map((h) => (
                                        <SelectItem key={h} value={h}>
                                            {h}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.hora_inicio && (
                                <p className="text-xs text-destructive">
                                    {errors.hora_inicio}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="hor-fim">Fim</Label>
                            <Select
                                value={data.hora_fim}
                                onValueChange={(v) => setData('hora_fim', v)}
                            >
                                <SelectTrigger id="hor-fim" className="w-full">
                                    <SelectValue placeholder="00:00" />
                                </SelectTrigger>
                                <SelectContent>
                                    {HORAS.map((h) => (
                                        <SelectItem key={h} value={h}>
                                            {h}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.hora_fim && (
                                <p className="text-xs text-destructive">
                                    {errors.hora_fim}
                                </p>
                            )}
                        </div>
                    </div>

                    {fimInvalido && (
                        <p className="text-xs text-destructive" role="alert">
                            O horário de fim deve ser depois do horário de
                            início.
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={processing || incompleto || fimInvalido}
                    >
                        Adicionar horário
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function HorariosCard({ horarios }: { horarios: HorarioDisponivel[] }) {
    const [open, setOpen] = useState(false);
    const { delete: remove, processing } = useForm();

    return (
        <>
            <Card className="gap-3 py-4 text-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-4">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <CalendarClock className="size-4" aria-hidden="true" />
                        Horários disponíveis
                    </CardTitle>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setOpen(true)}
                    >
                        <Plus aria-hidden="true" />
                        Adicionar
                    </Button>
                </CardHeader>
                <CardContent className="px-4">
                    {horarios.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nenhum horário cadastrado ainda.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {horarios.map((h) => (
                                <li
                                    key={h.id}
                                    className="flex items-center gap-2 rounded-md border bg-background py-1 pr-1 pl-2 text-xs"
                                >
                                    <Badge
                                        variant="outline"
                                        className="px-1.5 text-[0.6875rem]"
                                    >
                                        {DIAS[h.dia_semana].slice(0, 3)}
                                    </Badge>
                                    <span>
                                        {h.hora_inicio.slice(0, 5)} –{' '}
                                        {h.hora_fim.slice(0, 5)}
                                    </span>
                                    <span className="ml-auto text-[0.6875rem] text-muted-foreground">
                                        {h.tipo === 'coleta'
                                            ? 'Coleta'
                                            : 'Entrega'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            remove(destroyHorario(h.id).url, {
                                                preserveScroll: true,
                                            })
                                        }
                                        disabled={
                                            processing ||
                                            h.pode_excluir === false
                                        }
                                        title={
                                            h.pode_excluir === false
                                                ? 'Não é possível excluir: há doações pendentes ou confirmadas neste horário.'
                                                : 'Excluir horário'
                                        }
                                        aria-label={`Excluir horário de ${DIAS[h.dia_semana]}, ${h.hora_inicio.slice(0, 5)} às ${h.hora_fim.slice(0, 5)}`}
                                        className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-foreground"
                                    >
                                        <Trash2
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <HorarioModal open={open} setOpen={setOpen} />
        </>
    );
}
