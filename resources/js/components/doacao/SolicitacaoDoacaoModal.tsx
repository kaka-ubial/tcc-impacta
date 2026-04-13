import { router, usePage } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { store as doacoesStore } from '@/routes/doacoes';
import type { CategoriaItem, HorarioDisponivel } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function fmt(hora: string) {
    return hora.slice(0, 5); // "HH:MM"
}

/**
 * Returns the next `weeks` occurrences of each (dia_semana, hora_inicio) pair.
 * Only future datetimes are included.
 */
function buildUpcomingDates(horarios: HorarioDisponivel[], tipo: 'coleta' | 'entrega', weeks = 4) {
    const filtered = horarios.filter((h) => h.tipo === tipo);
    const now = new Date();
    const results: { label: string; value: string; horarioId: number }[] = [];

    for (const h of filtered) {
        for (let w = 0; w < weeks; w++) {
            const d = new Date(now);
            const diff = (h.dia_semana - d.getDay() + 7 + w * 7) % 7 || (w === 0 ? 7 : 0);
            d.setDate(d.getDate() + diff);
            const [hh, mm] = h.hora_inicio.split(':');
            d.setHours(Number(hh), Number(mm), 0, 0);
            if (d > now) {
                const dateStr = d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
                results.push({
                    label: `${DIAS[h.dia_semana]}, ${d.toLocaleDateString('pt-BR')} — ${fmt(h.hora_inicio)} às ${fmt(h.hora_fim)}`,
                    value: dateStr,
                    horarioId: h.id,
                });
            }
        }
    }

    return results.sort((a, b) => a.value.localeCompare(b.value));
}

// ─── tipos internos ──────────────────────────────────────────────────────────

type Item = {
    categoria_id: string;
    quantidade: string;
    descricao: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    instituicaoId: number;
    categorias: CategoriaItem[];
    horariosDisponiveis: HorarioDisponivel[];
};

const STEPS = ['Itens', 'Agendamento', 'Confirmação'] as const;

// ─── componente principal ────────────────────────────────────────────────────

export function SolicitacaoDoacaoModal({ open, onClose, instituicaoId, categorias, horariosDisponiveis }: Props) {
    const [step, setStep] = useState(0);
    const [itens, setItens] = useState<Item[]>([{ categoria_id: '', quantidade: '1', descricao: '' }]);
    const [tipo, setTipo] = useState<'coleta' | 'entrega'>('entrega');
    const [dataHora, setDataHora] = useState('');
    const [enderecoReferencia, setEnderecoReferencia] = useState('');

    const [processing, setProcessing] = useState(false);
    const { errors } = usePage().props as { errors: Record<string, string> };

    const upcomingDates = buildUpcomingDates(horariosDisponiveis, tipo);
    const hasHorarios = upcomingDates.length > 0;

    function addItem() {
        setItens((prev) => [...prev, { categoria_id: '', quantidade: '1', descricao: '' }]);
    }

    function removeItem(i: number) {
        setItens((prev) => prev.filter((_, idx) => idx !== i));
    }

    function updateItem(i: number, field: keyof Item, value: string) {
        setItens((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
    }

    function handleClose() {
        setStep(0);
        setItens([{ categoria_id: '', quantidade: '1', descricao: '' }]);
        setTipo('entrega');
        setDataHora('');
        setEnderecoReferencia('');
        onClose();
    }

    function canAdvanceStep1() {
        return itens.every((it) => it.categoria_id && Number(it.quantidade) >= 1);
    }

    function canAdvanceStep2() {
        if (!dataHora) return false;
        if (tipo === 'coleta' && !enderecoReferencia.trim()) return false;
        return true;
    }

    function handleSubmit() {
        setProcessing(true);
        router.post(
            doacoesStore().url,
            {
                instituicao_id: instituicaoId,
                itens: itens.map((it) => ({
                    categoria_id: Number(it.categoria_id),
                    quantidade: Number(it.quantidade),
                    descricao: it.descricao || null,
                })),
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
                    <DialogTitle>Solicitar doação</DialogTitle>
                </DialogHeader>

                {/* stepper */}
                <div className="flex items-center gap-2 text-sm">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <span
                                className={[
                                    'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                                    i === step
                                        ? 'bg-primary text-primary-foreground'
                                        : i < step
                                          ? 'bg-primary/30 text-primary'
                                          : 'bg-muted text-muted-foreground',
                                ].join(' ')}
                            >
                                {i + 1}
                            </span>
                            <span className={i === step ? 'font-medium' : 'text-muted-foreground'}>{s}</span>
                            {i < STEPS.length - 1 && <span className="text-muted-foreground">›</span>}
                        </div>
                    ))}
                </div>

                <Separator />

                {/* ── step 1: itens ─────────────────────────────────────── */}
                {step === 0 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <Label>Tipo de entrega</Label>
                            <Select value={tipo} onValueChange={(v) => setTipo(v as 'coleta' | 'entrega')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrega">Entrega — eu levo até a instituição</SelectItem>
                                    <SelectItem value="coleta">Coleta — a instituição busca em mim</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="flex flex-col gap-3">
                            <Label>Itens a doar</Label>
                            {itens.map((item, i) => (
                                <div key={i} className="flex flex-col gap-2 rounded-lg border p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Item {i + 1}</span>
                                        {itens.length > 1 && (
                                            <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs">Categoria</Label>
                                            <Select
                                                value={item.categoria_id}
                                                onValueChange={(v) => updateItem(i, 'categoria_id', v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categorias.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>
                                                            {c.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs">Quantidade</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={item.quantidade}
                                                onChange={(e) => updateItem(i, 'quantidade', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-xs">Descrição (opcional)</Label>
                                        <Input
                                            placeholder="ex: roupas de inverno masculinas"
                                            value={item.descricao}
                                            onChange={(e) => updateItem(i, 'descricao', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                                <Plus className="size-3.5" />
                                Adicionar item
                            </Button>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={() => setStep(1)} disabled={!canAdvanceStep1()}>
                                Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── step 2: agendamento ───────────────────────────────── */}
                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        {!hasHorarios ? (
                            <p className="text-muted-foreground text-sm">
                                Esta instituição não possui horários disponíveis cadastrados para {tipo === 'coleta' ? 'coleta' : 'entrega'}.
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-col gap-1">
                                    <Label>Data e horário disponível</Label>
                                    <Select value={dataHora} onValueChange={setDataHora}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma data" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {upcomingDates.map((d) => (
                                                <SelectItem key={d.value} value={d.value}>
                                                    {d.label}
                                                </SelectItem>
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

                        {errors['agendamento.data_hora'] && (
                            <p className="text-destructive text-xs">{errors['agendamento.data_hora']}</p>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(0)}>
                                Voltar
                            </Button>
                            <Button onClick={() => setStep(2)} disabled={!canAdvanceStep2()}>
                                Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── step 3: confirmação ───────────────────────────────── */}
                {step === 2 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
                            <p className="font-medium">Resumo da solicitação</p>
                            <Separator />
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground w-24 shrink-0">Tipo:</span>
                                <Badge variant="outline">
                                    {tipo === 'entrega' ? 'Entrega (eu levo)' : 'Coleta (buscam em mim)'}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">Itens:</span>
                                <ul className="list-inside list-disc space-y-0.5 pl-1">
                                    {itens.map((it, i) => {
                                        const cat = categorias.find((c) => String(c.id) === it.categoria_id);
                                        return (
                                            <li key={i}>
                                                {it.quantidade}× {cat?.nome ?? '—'}
                                                {it.descricao && (
                                                    <span className="text-muted-foreground"> ({it.descricao})</span>
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
                            Após o envio, a instituição irá avaliar e confirmar ou recusar a solicitação.
                        </p>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                Voltar
                            </Button>
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
