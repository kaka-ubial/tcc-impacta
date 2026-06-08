import { useForm } from '@inertiajs/react';
import { CalendarClock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sugerir as sugerirRoute } from '@/routes/instituicao/agenda';

// ─── types ─────────────────────────────────────────────────────────────────

export type Horario = {
    id: number;
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
    tipo: 'coleta' | 'entrega';
};

type Props = {
    agendamentoId: number;
    dataHoraAtual: string;
    tipo: 'coleta' | 'entrega';
    horarios: Horario[];
    trigger?: React.ReactNode;
};

// ─── helpers ───────────────────────────────────────────────────────────────

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function buildUpcomingDates(horarios: Horario[], tipo: 'coleta' | 'entrega', weeks = 4) {
    const agora = new Date();
    const opcoes: { label: string; value: string }[] = [];

    for (const h of horarios.filter((x) => x.tipo === tipo)) {
        for (let w = 0; w < weeks; w++) {
            const d = new Date(agora);
            const diff = (h.dia_semana - d.getDay() + 7) % 7;
            d.setDate(d.getDate() + diff + w * 7);
            d.setHours(Number(h.hora_inicio.slice(0, 2)), Number(h.hora_inicio.slice(3, 5)), 0, 0);

            if (d > agora) {
                const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                opcoes.push({
                    label: `${DIAS[h.dia_semana]}, ${d.toLocaleDateString('pt-BR')} — ${h.hora_inicio.slice(0, 5)} às ${h.hora_fim.slice(0, 5)}`,
                    value,
                });
            }
        }
    }

    return opcoes.sort((a, b) => a.value.localeCompare(b.value));
}

function formatDataHora(iso: string): string {
    const d = new Date(iso);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── component ─────────────────────────────────────────────────────────────

export default function SugerirAlteracaoDialog({ agendamentoId, dataHoraAtual, tipo, horarios, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ data_hora_sugerida: '' });

    const opcoes = useMemo(() => buildUpcomingDates(horarios, tipo), [horarios, tipo]);
    const tipoLabel = tipo === 'coleta' ? 'coleta' : 'entrega';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(sugerirRoute(agendamentoId).url, {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); reset(); },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button variant="outline" size="sm" className="gap-1.5">
                        <CalendarClock className="size-3.5" />
                        Sugerir outra data
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Sugerir nova data</DialogTitle>
                <DialogDescription>
                    Agendado para {formatDataHora(dataHoraAtual)}. Escolha um horário entre os que
                    você cadastrou como disponíveis para {tipoLabel} — o doador precisa aceitar para valer.
                </DialogDescription>
                {opcoes.length === 0 ? (
                    <p className="text-muted-foreground text-sm pt-2">
                        Você ainda não tem horários de {tipoLabel} cadastrados.
                    </p>
                ) : (
                    <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
                        <div className="flex flex-col gap-1">
                            <Label>Nova data e horário</Label>
                            <Select value={data.data_hora_sugerida} onValueChange={(v) => setData('data_hora_sugerida', v)}>
                                <SelectTrigger><SelectValue placeholder="Selecione um horário" /></SelectTrigger>
                                <SelectContent>
                                    {opcoes.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.data_hora_sugerida && (
                                <p className="text-destructive text-xs">{errors.data_hora_sugerida}</p>
                            )}
                        </div>
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancelar</Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing || !data.data_hora_sugerida}>
                                {processing ? 'Enviando...' : 'Enviar sugestão'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
