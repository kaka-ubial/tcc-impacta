import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarClock,
    Check,
    HeartHandshake,
    PartyPopper,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { DIAS, HORAS } from '@/lib/horarios';
import { home } from '@/routes';
import { ficha } from '@/routes/waiting-validation';
import {
    destroy as destroyHorario,
    store as storeHorario,
} from '@/routes/waiting-validation/horarios';
import type { HorarioDisponivel } from '@/types';

type Props = {
    nomeFantasia: string | null;
    horarios: HorarioDisponivel[];
};

function HorarioForm() {
    const { data, setData, post, processing, errors, reset } = useForm({
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

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(storeHorario().url, {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="grid gap-3 rounded-xl border bg-muted/40 p-4 sm:grid-cols-2"
        >
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="onb-tipo">Tipo</Label>
                <Select
                    value={data.tipo}
                    onValueChange={(v) => setData('tipo', v)}
                >
                    <SelectTrigger id="onb-tipo" className="w-full">
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
                    <p className="text-xs text-destructive">{errors.tipo}</p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="onb-dia">Dia da semana</Label>
                <Select
                    value={data.dia_semana}
                    onValueChange={(v) => setData('dia_semana', v)}
                >
                    <SelectTrigger id="onb-dia" className="w-full">
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

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="onb-inicio">Início</Label>
                <Select
                    value={data.hora_inicio}
                    onValueChange={(v) => setData('hora_inicio', v)}
                >
                    <SelectTrigger id="onb-inicio" className="w-full">
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
                <Label htmlFor="onb-fim">Fim</Label>
                <Select
                    value={data.hora_fim}
                    onValueChange={(v) => setData('hora_fim', v)}
                >
                    <SelectTrigger id="onb-fim" className="w-full">
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

            {fimInvalido && (
                <p
                    className="text-xs text-destructive sm:col-span-2"
                    role="alert"
                >
                    O horário de fim deve ser depois do horário de início.
                </p>
            )}

            <Button
                type="submit"
                className="sm:col-span-2"
                disabled={processing || incompleto || fimInvalido}
            >
                Adicionar horário
            </Button>
        </form>
    );
}

function HorarioList({ horarios }: { horarios: HorarioDisponivel[] }) {
    const { delete: remove, processing } = useForm();

    return (
        <ul className="flex flex-col gap-2">
            {horarios.map((h) => (
                <li
                    key={h.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline">{DIAS[h.dia_semana]}</Badge>
                        <span>
                            {h.hora_inicio.slice(0, 5)} –{' '}
                            {h.hora_fim.slice(0, 5)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {h.tipo === 'coleta' ? 'Coleta' : 'Entrega'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            remove(destroyHorario(h.id).url, {
                                preserveScroll: true,
                            })
                        }
                        disabled={processing}
                        aria-label={`Remover horário de ${DIAS[h.dia_semana]}, ${h.hora_inicio.slice(0, 5)} às ${h.hora_fim.slice(0, 5)}`}
                        className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                        <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                </li>
            ))}
        </ul>
    );
}

const STEPS = [
    { title: 'Cadastro enviado', short: 'Cadastro' },
    { title: 'Defina seus horários', short: 'Horários' },
    { title: 'Análise da equipe', short: 'Análise' },
] as const;

function Stepper({
    current,
    horariosOk,
    onSelect,
}: {
    current: number;
    horariosOk: boolean;
    onSelect: (index: number) => void;
}) {
    return (
        <nav aria-label="Etapas do cadastro">
            <ol className="flex items-center">
                {STEPS.map((step, index) => {
                    const done = index === 0 || (index === 1 && horariosOk);
                    const active = index === current;

                    return (
                        <li
                            key={step.short}
                            className="flex flex-1 items-center last:flex-none"
                        >
                            <button
                                type="button"
                                onClick={() => onSelect(index)}
                                aria-current={active ? 'step' : undefined}
                                className="group flex flex-col items-center gap-1.5"
                            >
                                <span
                                    className={`flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                                        done
                                            ? 'border-brand bg-brand text-primary-foreground'
                                            : active
                                              ? 'border-brand-strong bg-brand-soft text-foreground'
                                              : 'border-dashed text-muted-foreground'
                                    } ${active ? 'scale-110' : ''}`}
                                >
                                    {done ? (
                                        <Check
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        index + 1
                                    )}
                                </span>
                                <span
                                    className={`text-xs transition-colors ${
                                        active
                                            ? 'font-semibold text-foreground'
                                            : 'text-muted-foreground'
                                    }`}
                                >
                                    {step.short}
                                    <span className="sr-only">
                                        {done ? ' (concluída)' : ''}
                                    </span>
                                </span>
                            </button>
                            {index < STEPS.length - 1 && (
                                <span
                                    aria-hidden="true"
                                    className="mx-2 mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-border"
                                >
                                    <span
                                        className={`block h-full bg-brand-strong transition-all duration-500 ${
                                            index < current || done
                                                ? 'w-full'
                                                : 'w-0'
                                        }`}
                                    />
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export default function WaitingApproval({ nomeFantasia, horarios }: Props) {
    const temHorarios = horarios.length > 0;

    const [step, setStep] = useState(temHorarios ? 2 : 0);
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');
    const headingRef = useRef<HTMLHeadingElement>(null);
    const firstRender = useRef(true);

    function goTo(next: number) {
        if (next === step) {
            return;
        }

        setDirection(next > step ? 'forward' : 'back');
        setStep(next);
    }

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        headingRef.current?.focus();
    }, [step]);

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['nomeFantasia'] });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const concluidas = 1 + (temHorarios ? 1 : 0);
    const animation =
        direction === 'forward'
            ? 'slide-in-from-right-8'
            : 'slide-in-from-left-8';

    return (
        <div className="flex min-h-screen flex-col bg-muted/50">
            <Head title="Complete seu cadastro" />

            <header className="flex h-14 shrink-0 items-center px-6 lg:px-10">
                <Link
                    href={home()}
                    className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-75"
                >
                    <div className="flex size-7 items-center justify-center rounded-md bg-brand text-primary-foreground">
                        <HeartHandshake className="size-4" aria-hidden="true" />
                    </div>
                    Impacta
                </Link>
            </header>

            <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-4 pt-2 pb-12 sm:px-6">
                <Stepper
                    current={step}
                    horariosOk={temHorarios}
                    onSelect={goTo}
                />

                <div className="overflow-hidden">
                    <section
                        key={step}
                        aria-labelledby="etapa-titulo"
                        className={`animate-in fade-in ${animation} flex flex-col gap-6 rounded-3xl border bg-background p-6 shadow-sm duration-500 sm:p-8`}
                    >
                        {step === 0 && (
                            <>
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="flex size-16 items-center justify-center rounded-full bg-brand-soft">
                                        <PartyPopper
                                            className="size-8 text-brand-strong"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <h1
                                        id="etapa-titulo"
                                        ref={headingRef}
                                        tabIndex={-1}
                                        className="text-2xl font-semibold outline-none"
                                    >
                                        {nomeFantasia
                                            ? `Bem-vinda, ${nomeFantasia}!`
                                            : 'Cadastro recebido!'}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Recebemos o cadastro da sua instituição.
                                        Enquanto nossa equipe confere os dados,
                                        vamos deixar tudo pronto para você
                                        começar a receber doações assim que a
                                        conta for liberada. Leva só um minuto.
                                    </p>
                                </div>
                                <Button size="lg" onClick={() => goTo(1)}>
                                    Começar
                                    <ArrowRight aria-hidden="true" />
                                </Button>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft">
                                        <CalendarClock
                                            className="size-6 text-brand-strong"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <h1
                                        id="etapa-titulo"
                                        ref={headingRef}
                                        tabIndex={-1}
                                        className="text-2xl font-semibold outline-none"
                                    >
                                        Defina seus horários
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Informe quando você recebe doações ou
                                        faz coletas. É com esses horários que os
                                        doadores vão agendar.
                                    </p>
                                </div>

                                {temHorarios && (
                                    <HorarioList horarios={horarios} />
                                )}
                                <HorarioForm />

                                <div className="flex items-center justify-between gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => goTo(0)}
                                    >
                                        <ArrowLeft aria-hidden="true" />
                                        Voltar
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        {!temHorarios && (
                                            <Button
                                                variant="ghost"
                                                onClick={() => goTo(2)}
                                            >
                                                Fazer depois
                                            </Button>
                                        )}
                                        <Button
                                            disabled={!temHorarios}
                                            onClick={() => goTo(2)}
                                        >
                                            Continuar
                                            <ArrowRight aria-hidden="true" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="relative flex size-16 items-center justify-center rounded-full bg-brand-soft">
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-0 animate-ping rounded-full bg-brand/30"
                                        />
                                        <ShieldCheck
                                            className="relative size-8 text-brand-strong"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <h1
                                        id="etapa-titulo"
                                        ref={headingRef}
                                        tabIndex={-1}
                                        className="text-2xl font-semibold outline-none"
                                    >
                                        Análise da equipe
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {temHorarios
                                            ? 'Tudo certo do seu lado! Estamos conferindo os dados da instituição.'
                                            : 'Estamos conferindo os dados da instituição.'}{' '}
                                        Esta página atualiza sozinha e você
                                        entra no painel assim que for aprovada.
                                    </p>
                                    <div
                                        role="status"
                                        className="flex items-center gap-2 text-sm text-muted-foreground"
                                    >
                                        <Spinner aria-hidden="true" />
                                        Aguardando aprovação
                                    </div>
                                </div>

                                {!temHorarios && (
                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed bg-muted/40 p-4">
                                        <p className="text-sm">
                                            Falta definir seus horários para
                                            receber doações assim que aprovada.
                                        </p>
                                        <Button
                                            size="sm"
                                            onClick={() => goTo(1)}
                                        >
                                            Definir
                                        </Button>
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => goTo(1)}
                                    >
                                        <ArrowLeft aria-hidden="true" />
                                        Horários
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href={ficha()}>
                                            <UserRound aria-hidden="true" />
                                            Ver ficha de cadastro
                                        </Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </section>
                </div>

                <p
                    className="text-center text-xs text-muted-foreground"
                    aria-live="polite"
                >
                    {concluidas} de {STEPS.length} etapas concluídas
                </p>
            </main>
        </div>
    );
}
