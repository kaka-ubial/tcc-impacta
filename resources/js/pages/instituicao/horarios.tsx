import { useForm } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { CalendarClock, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, HorarioDisponivel } from '@/types';
import { destroy as destroyHorario, store as storeHorario } from '@/routes/instituicao/horarios';

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const HORAS = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, '0');

    return [`${h}:00`, `${h}:30`];
}).flat();

type Props = {
    horarios: HorarioDisponivel[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: '/instituicao/painel' },
    { title: 'Horários disponíveis', href: '/instituicao/horarios' },
];

export default function Horarios({ horarios }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        dia_semana: '',
        hora_inicio: '',
        hora_fim: '',
        tipo: '',
    });

    const { delete: deleteHorario, processing: deleting } = useForm();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(storeHorario().url, {
            onSuccess: () => reset(),
        });
    }

    function handleDelete(id: number) {
        deleteHorario(destroyHorario(id).url);
    }

    const coleta = horarios.filter((h) => h.tipo === 'coleta');
    const entrega = horarios.filter((h) => h.tipo === 'entrega');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Horários disponíveis" />

            <div className="flex flex-col gap-8 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">Horários disponíveis</h1>
                    <p className="text-muted-foreground text-sm">
                        Configure os dias e horários em que aceita receber doações ou fazer coletas.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* formulário de adição */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CalendarClock className="size-4" />
                                Adicionar horário
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <Label>Tipo</Label>
                                    <Select value={data.tipo} onValueChange={(v) => setData('tipo', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="entrega">Entrega (doador traz)</SelectItem>
                                            <SelectItem value="coleta">Coleta (buscamos no doador)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.tipo && <p className="text-destructive text-xs">{errors.tipo}</p>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <Label>Dia da semana</Label>
                                    <Select value={data.dia_semana} onValueChange={(v) => setData('dia_semana', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DIAS.map((d, i) => (
                                                <SelectItem key={i} value={String(i)}>
                                                    {d}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.dia_semana && <p className="text-destructive text-xs">{errors.dia_semana}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <Label>Início</Label>
                                        <Select value={data.hora_inicio} onValueChange={(v) => setData('hora_inicio', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="00:00" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {HORAS.map((h) => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.hora_inicio && <p className="text-destructive text-xs">{errors.hora_inicio}</p>}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label>Fim</Label>
                                        <Select value={data.hora_fim} onValueChange={(v) => setData('hora_fim', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="00:00" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {HORAS.map((h) => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.hora_fim && <p className="text-destructive text-xs">{errors.hora_fim}</p>}
                                    </div>
                                </div>

                                {data.hora_inicio && data.hora_fim && data.hora_fim <= data.hora_inicio && (
                                    <p className="text-destructive text-xs">Horário de fim deve ser depois do horário de início</p>
                                )}

                                <Button type="submit" disabled={processing || !data.tipo || !data.dia_semana || !data.hora_inicio || !data.hora_fim || data.hora_fim <= data.hora_inicio}>
                                    Adicionar
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* listagem */}
                    <div className="flex flex-col gap-4">
                        {horarios.length === 0 ? (
                            <div className="text-muted-foreground rounded-xl border border-dashed px-6 py-10 text-center text-sm">
                                Nenhum horário cadastrado ainda.
                            </div>
                        ) : (
                            <>
                                {[
                                    { label: 'Entrega', items: entrega },
                                    { label: 'Coleta', items: coleta },
                                ].map(({ label, items }) =>
                                    items.length > 0 ? (
                                        <div key={label} className="flex flex-col gap-2">
                                            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">{label}</p>
                                            {items.map((h) => (
                                                <div key={h.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline">{DIAS[h.dia_semana]}</Badge>
                                                        <span className="text-sm">
                                                            {h.hora_inicio.slice(0, 5)} – {h.hora_fim.slice(0, 5)}
                                                        </span>
                                                    </div>
                                                    <TooltipProvider delayDuration={100}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span tabIndex={0}>
                                                                    <button
                                                                        onClick={() => handleDelete(h.id)}
                                                                        disabled={deleting || h.pode_excluir === false}
                                                                        className="text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted-foreground"
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                    </button>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {h.pode_excluir === false
                                                                    ? 'Não é possível excluir: há doações pendentes ou confirmadas neste horário.'
                                                                    : 'Excluir horário'}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            ))}
                                            <Separator />
                                        </div>
                                    ) : null
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
