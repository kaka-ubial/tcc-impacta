import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { store as doacoesStore } from '@/routes/doacoes';
import type { HorarioDisponivel, NecessidadeAtiva } from '@/types';

type Props = {
    open: boolean;
    onClose: () => void;
    instituicaoId: number;
    necessidades: NecessidadeAtiva[];
    horariosDisponiveis: HorarioDisponivel[];
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function fmt(hora: string) {
    return hora.slice(0, 5);
}

function buildUpcomingDates(horarios: HorarioDisponivel[], tipo: 'coleta' | 'entrega', weeks = 4) {
    const filtered = horarios.filter((h) => h.tipo === tipo);
    const now = new Date();
    const results: { label: string; value: string }[] = [];

    for (const h of filtered) {
        for (let w = 0; w < weeks; w++) {
            const d = new Date(now);
            const diff = (h.dia_semana - d.getDay() + 7 + w * 7) % 7 || (w === 0 ? 7 : 0);
            d.setDate(d.getDate() + diff);
            const [hh, mm] = h.hora_inicio.split(':');
            d.setHours(Number(hh), Number(mm), 0, 0);
            if (d > now) {
                results.push({
                    label: `${DIAS[h.dia_semana]}, ${d.toLocaleDateString('pt-BR')} — ${fmt(h.hora_inicio)} às ${fmt(h.hora_fim)}`,
                    value: d.toISOString().slice(0, 16),
                });
            }
        }
    }

    return results.sort((a, b) => a.value.localeCompare(b.value));
}

const prioridadeConfig = {
    alta:  { variant: 'destructive' as const, label: 'Alta' },
    media: { variant: 'default'     as const, label: 'Média' },
    baixa: { variant: 'secondary'   as const, label: 'Baixa' },
};

const STEPS = ['Necessidades', 'Agendamento', 'Confirmação'] as const;

// ─── component ───────────────────────────────────────────────────────────────

export function DoacaoNecessidadesModal({ open, onClose, instituicaoId, necessidades, horariosDisponiveis }: Props) {
    const [step, setStep] = useState(0);
    const [selected, setSelected] = useState<Record<number, number>>({});
    const [tipo, setTipo] = useState<'coleta' | 'entrega'>('entrega');
    const [dataHora, setDataHora] = useState('');
    const [enderecoReferencia, setEnderecoReferencia] = useState('');
    const [processing, setProcessing] = useState(false);

    const abertas = necessidades.filter((n) => n.quantidade_atual < n.quantidade_objetivo);
    const upcomingDates = buildUpcomingDates(horariosDisponiveis, tipo);

    function toggle(n: NecessidadeAtiva) {
        setSelected((prev) => {
            if (prev[n.id] !== undefined) {
                const next = { ...prev };
                delete next[n.id];
                return next;
            }
            return { ...prev, [n.id]: 1 };
        });
    }

    function setQty(id: number, value: string) {
        const n = necessidades.find((x) => x.id === id)!;
        const remaining = n.quantidade_objetivo - n.quantidade_atual;
        const qty = Math.min(Math.max(1, Number(value) || 1), remaining);
        setSelected((prev) => ({ ...prev, [id]: qty }));
    }

    function handleClose() {
        setStep(0);
        setSelected({});
        setTipo('entrega');
        setDataHora('');
        setEnderecoReferencia('');
        onClose();
    }

    const selectedIds = Object.keys(selected).map(Number);
    const canAdvanceStep1 = selectedIds.length > 0;
    const canAdvanceStep2 = dataHora !== '' && (tipo !== 'coleta' || enderecoReferencia.trim() !== '');

    function handleSubmit() {
        setProcessing(true);

        const itens = selectedIds.map((id) => {
            const n = necessidades.find((x) => x.id === id)!;
            return {
                necessidade_id: n.id,
                categoria_id: n.categoria.id,
                quantidade: selected[id],
                descricao: null,
            };
        });

        router.post(
            doacoesStore().url,
            {
                instituicao_id: instituicaoId,
                itens,
                agendamento: {
                    tipo,
                    data_hora: dataHora.replace('T', ' ') + ':00',
                    endereco_referencia: tipo === 'coleta' ? enderecoReferencia : null,
                },
            },
            {
                onSuccess: () => { setProcessing(false); handleClose(); },
                onError: () => setProcessing(false),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Atender necessidades</DialogTitle>
                </DialogHeader>

                {/* stepper */}
                <div className="flex items-center gap-2 text-sm">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <span className={[
                                'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                                i === step ? 'bg-primary text-primary-foreground'
                                    : i < step ? 'bg-primary/30 text-primary'
                                    : 'bg-muted text-muted-foreground',
                            ].join(' ')}>
                                {i + 1}
                            </span>
                            <span className={i === step ? 'font-medium' : 'text-muted-foreground'}>{s}</span>
                            {i < STEPS.length - 1 && <span className="text-muted-foreground">›</span>}
                        </div>
                    ))}
                </div>

                <Separator />

                {/* ── step 1: necessidades ──────────────────────────────── */}
                {step === 0 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <Label>Tipo de entrega</Label>
                            <Select value={tipo} onValueChange={(v) => setTipo(v as 'coleta' | 'entrega')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrega">Entrega — eu levo até a instituição</SelectItem>
                                    <SelectItem value="coleta">Coleta — a instituição busca em mim</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <Label>Selecione as necessidades que deseja atender</Label>

                        {abertas.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Todas as necessidades já foram atendidas.</p>
                        ) : (
                            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                                {abertas.map((n) => {
                                    const remaining = n.quantidade_objetivo - n.quantidade_atual;
                                    const pct = Math.round((n.quantidade_atual / n.quantidade_objetivo) * 100);
                                    const isSelected = selected[n.id] !== undefined;
                                    const cfg = prioridadeConfig[n.prioridade];

                                    return (
                                        <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => toggle(n)}
                                            className={[
                                                'flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors',
                                                isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'hover:border-muted-foreground/40',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-medium">{n.categoria.nome}</span>
                                                    {n.descricao && (
                                                        <span className="text-muted-foreground text-xs">{n.descricao}</span>
                                                    )}
                                                </div>
                                                <Badge variant={cfg.variant} className="shrink-0 text-xs">
                                                    {cfg.label}
                                                </Badge>
                                            </div>

                                            {/* progress */}
                                            <div className="flex flex-col gap-1">
                                                <div className="text-muted-foreground flex justify-between text-xs">
                                                    <span>{pct}% atendido</span>
                                                    <span>{n.quantidade_atual}/{n.quantidade_objetivo} · faltam {remaining}</span>
                                                </div>
                                                <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                                                    <div
                                                        className="bg-primary h-full rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* quantity input when selected */}
                                            {isSelected && (
                                                <div
                                                    className="flex items-center gap-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Label className="text-xs">Quantidade</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={remaining}
                                                        value={selected[n.id]}
                                                        onChange={(e) => setQty(n.id, e.target.value)}
                                                        className="h-7 w-20 text-sm"
                                                    />
                                                    <span className="text-muted-foreground text-xs">de {remaining} disponíveis</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button onClick={() => setStep(1)} disabled={!canAdvanceStep1}>
                                Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── step 2: agendamento ───────────────────────────────── */}
                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        {upcomingDates.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Nenhum horário disponível para {tipo === 'coleta' ? 'coleta' : 'entrega'}.
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-col gap-1">
                                    <Label>Data e horário</Label>
                                    <Select value={dataHora} onValueChange={setDataHora}>
                                        <SelectTrigger><SelectValue placeholder="Selecione uma data" /></SelectTrigger>
                                        <SelectContent>
                                            {upcomingDates.map((d) => (
                                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {tipo === 'coleta' && (
                                    <div className="flex flex-col gap-1">
                                        <Label>Seu endereço para coleta</Label>
                                        <Input
                                            placeholder="Rua, número, bairro, cidade"
                                            value={enderecoReferencia}
                                            onChange={(e) => setEnderecoReferencia(e.target.value)}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(0)}>Voltar</Button>
                            <Button onClick={() => setStep(2)} disabled={!canAdvanceStep2}>Próximo</Button>
                        </div>
                    </div>
                )}

                {/* ── step 3: confirmação ───────────────────────────────── */}
                {step === 2 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
                            <p className="font-medium">Resumo</p>
                            <Separator />
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground w-24 shrink-0">Tipo:</span>
                                <Badge variant="outline">
                                    {tipo === 'entrega' ? 'Entrega (eu levo)' : 'Coleta (buscam)'}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Itens:</span>
                                <ul className="list-inside list-disc space-y-0.5 pl-1">
                                    {selectedIds.map((id) => {
                                        const n = necessidades.find((x) => x.id === id)!;
                                        return (
                                            <li key={id}>
                                                {selected[id]}× {n.categoria.nome}
                                                {n.descricao && (
                                                    <span className="text-muted-foreground"> ({n.descricao})</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground w-24 shrink-0">Data/hora:</span>
                                <span>{dataHora.replace('T', ' ')}</span>
                            </div>
                            {tipo === 'coleta' && enderecoReferencia && (
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-24 shrink-0">Endereço:</span>
                                    <span>{enderecoReferencia}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-muted-foreground text-xs">
                            O progresso das necessidades será atualizado quando a instituição confirmar a solicitação.
                        </p>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                            <Button onClick={handleSubmit} disabled={processing}>
                                {processing ? 'Enviando…' : 'Enviar solicitação'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
