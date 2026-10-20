import { CalendarClock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DIAS } from '@/lib/horarios';
import type { HorarioDisponivel } from '@/types';

const TIPO_LABEL: Record<HorarioDisponivel['tipo'], string> = {
    entrega: 'Entrega',
    coleta: 'Coleta',
};

/**
 * Versão só-leitura dos horários, para quem visita o perfil. A instituição
 * edita os próprios horários pelo HorariosCard.
 */
export function HorariosPublicosCard({
    horarios,
}: {
    horarios: HorarioDisponivel[];
}) {
    // Já vêm ordenados por dia e hora do backend; aqui só agrupa por dia.
    const porDia = new Map<number, HorarioDisponivel[]>();

    for (const h of horarios) {
        porDia.set(h.dia_semana, [...(porDia.get(h.dia_semana) ?? []), h]);
    }

    const tipos = new Set(horarios.map((h) => h.tipo));

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    <CalendarClock className="size-4" />
                    Horários para doação
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
                {horarios.length === 0 ? (
                    <p className="text-muted-foreground">
                        Esta instituição ainda não cadastrou horários.
                    </p>
                ) : (
                    <>
                        <dl className="flex flex-col gap-2">
                            {[...porDia].map(([dia, slots]) => (
                                <div
                                    key={dia}
                                    className="grid grid-cols-[6.5rem_1fr] gap-2"
                                >
                                    <dt className="font-medium">{DIAS[dia]}</dt>
                                    <dd className="flex flex-col gap-0.5">
                                        {slots.map((h) => (
                                            <span
                                                key={h.id}
                                                className="flex justify-between gap-2"
                                            >
                                                <span className="tabular-nums">
                                                    {h.hora_inicio.slice(0, 5)}{' '}
                                                    – {h.hora_fim.slice(0, 5)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {TIPO_LABEL[h.tipo]}
                                                </span>
                                            </span>
                                        ))}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <p className="border-t pt-3 text-xs text-muted-foreground">
                            {tipos.has('entrega') &&
                                'Entrega: você leva até a instituição. '}
                            {tipos.has('coleta') &&
                                'Coleta: a instituição busca no seu endereço.'}
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
