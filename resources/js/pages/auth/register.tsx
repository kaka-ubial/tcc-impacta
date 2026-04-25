import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Check, Heart, UserRound } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { home, login } from '@/routes';
import { store } from '@/routes/register';

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoUsuario = 'doador' | 'instituicao' | null;
type Step = 1 | 2 | 3 | 4;

// ─── Constants ────────────────────────────────────────────────────────────────

const stepLabels = ['Conta', 'Perfil', 'Informações', 'Causas'];

const brandSlides = [
    {
        eyebrow: 'O que é o Impacta',
        heading: 'Conectamos quem quer ajudar com quem precisa.',
        body: 'Rápido, transparente e humano. Sem burocracia, sem intermediários desnecessários.',
    },
    {
        eyebrow: 'Para doadores',
        heading: 'Doe com intenção, acompanhe o impacto.',
        bullets: [
            'Encontre instituições verificadas perto de você',
            'Escolha o que e como entregar',
            'Acompanhe cada solicitação em tempo real',
        ],
    },
    {
        eyebrow: 'Para instituições',
        heading: 'Gerencie doações com clareza e autonomia.',
        bullets: [
            'Cadastre o que sua instituição precisa',
            'Receba solicitações de forma organizada',
            'Configure agendamentos de coleta e entrega',
        ],
    },
] as const;

// ─── Brand Panel ──────────────────────────────────────────────────────────────

function BrandPanel() {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        const timer = setInterval(() => {
            setCurrent((c) => (c + 1) % brandSlides.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [paused]);

    return (
        <div
            className="relative hidden overflow-hidden bg-brand lg:flex lg:flex-col"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Decorative fills */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/[0.05]" />
                <div className="absolute bottom-28 -left-16 h-56 w-56 rounded-full bg-white/[0.04]" />
            </div>

            {/* Slides */}
            <div className="relative flex-1">
                {brandSlides.map((slide, i) => (
                    <div
                        key={i}
                        className={cn(
                            'absolute inset-0 flex flex-col justify-center px-10 xl:px-14 transition-opacity duration-700 ease-out',
                            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none',
                        )}
                    >
                        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground/50">
                            {slide.eyebrow}
                        </p>
                        <h2 className="font-display mt-3 text-3xl font-bold leading-tight text-primary-foreground xl:text-4xl">
                            {slide.heading}
                        </h2>
                        {'body' in slide && (
                            <p className="mt-4 text-base leading-relaxed text-primary-foreground/70">
                                {slide.body}
                            </p>
                        )}
                        {'bullets' in slide && (
                            <ul className="mt-5 flex flex-col gap-3">
                                {slide.bullets.map((b, j) => (
                                    <li key={j} className="flex items-start gap-3 text-sm text-primary-foreground/80">
                                        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/20">
                                            <span className="size-1.5 rounded-full bg-white" />
                                        </span>
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>

            {/* Dot navigation */}
            <div className="relative z-10 flex shrink-0 justify-center gap-2 pb-10">
                {brandSlides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        aria-label={`Slide ${i + 1}`}
                        className={cn(
                            'h-1.5 rounded-full transition-all duration-300 ease-out',
                            i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50',
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
    const progress = (step - 1) / (stepLabels.length - 1);
    return (
        <div className="relative mb-8 flex items-start justify-between">
            {/* Track */}
            <div className="absolute top-4 left-4 right-4 h-px bg-border" />
            {/* Progress fill */}
            <div
                className="absolute top-4 left-4 h-px bg-brand transition-all duration-500 ease-out"
                style={{ width: `calc(${progress} * (100% - 2rem))` }}
            />
            {stepLabels.map((label, i) => {
                const n = i + 1;
                const done = step > n;
                const active = step === n;
                return (
                    <div key={n} className="relative z-10 flex flex-col items-center gap-1.5">
                        <div
                            className={cn(
                                'flex size-8 items-center justify-center rounded-full border-2 bg-warm-neutral text-xs font-bold transition-all duration-300',
                                done && 'border-brand bg-brand text-primary-foreground',
                                active && 'border-brand text-brand',
                                !active && !done && 'border-border text-muted-foreground/30',
                            )}
                        >
                            {done ? <Check className="size-3.5" /> : n}
                        </div>
                        <span
                            className={cn(
                                'text-center text-[0.5625rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-200',
                                active ? 'text-brand' : done ? 'text-muted-foreground' : 'text-muted-foreground/30',
                            )}
                        >
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Register({ causas }: { causas: any[] }) {
    const [step, setStep] = useState<Step>(1);
    const [tipo, setTipo] = useState<TipoUsuario>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: '',
        password: '',
        password_confirmation: '',
        tipo_usuario: '' as 'doador' | 'instituicao' | '',
        nome_completo: '',
        cpf: '',
        telefone: '',
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        telefone_inst: '',
        endereco_completo: '',
        causas_apoiadas: [] as number[],
    });

    function handleTipo(t: 'doador' | 'instituicao') {
        setTipo(t);
        setData('tipo_usuario', t);
    }

    function toggleCausa(id: number) {
        const current = data.causas_apoiadas;
        setData(
            'causas_apoiadas',
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    }

    function handleStepOne() {
        clearErrors();
        post('/validate/register-step-one', {
            preserveScroll: true,
            onSuccess: () => setStep(2),
        });
    }

    function nextStep() {
        setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
    }

    function prevStep() {
        setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post(store.url(), {
            onSuccess: () => reset('password', 'password_confirmation'),
        });
    }

    return (
        <div className="min-h-svh lg:grid lg:h-svh lg:grid-cols-2 lg:overflow-hidden">
            <Head title="Cadastro" />

            {/* ── Left — Form column ──────────────────────── */}
            <div className="flex flex-col bg-warm-neutral lg:overflow-y-auto">

                {/* Logo bar */}
                <header className="flex h-14 shrink-0 items-center px-6 lg:px-10">
                    <Link
                        href={home()}
                        className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-75"
                    >
                        <div className="flex size-7 items-center justify-center rounded-md bg-brand text-primary-foreground">
                            <Heart className="size-4" />
                        </div>
                        Impacta
                    </Link>
                </header>

                {/* Form area */}
                <div className="flex flex-col px-6 pb-12 pt-6 lg:px-10 lg:pt-8">
                    <div className="mx-auto w-full max-w-md">

                        {/* Heading */}
                        <div className="mb-8">
                            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                                Criar conta
                            </h1>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                                {stepLabels[step - 1]}
                            </p>
                        </div>

                        {/* Step indicator */}
                        <StepIndicator step={step} />

                        {/* Form content */}
                        <form onSubmit={submit} className="flex flex-col gap-5">

                            {/* ── Step 1 — Credenciais ── */}
                            {step === 1 && (
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="email" className="text-sm font-medium">
                                            E-mail
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="seu@email.com"
                                            className="h-11"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="password" className="text-sm font-medium">
                                            Senha
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            required
                                            autoComplete="new-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Crie uma senha"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="password_confirmation" className="text-sm font-medium">
                                            Confirmar senha
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            required
                                            autoComplete="new-password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Repita a senha"
                                        />
                                        <InputError message={errors.password_confirmation} />
                                    </div>

                                    <Button
                                        type="button"
                                        className="mt-1 h-11 w-full font-semibold"
                                        onClick={handleStepOne}
                                        disabled={processing || !data.email || !data.password || !data.password_confirmation}
                                    >
                                        {processing && <Spinner />}
                                        Continuar
                                    </Button>
                                </div>
                            )}

                            {/* ── Step 2 — Tipo de conta ── */}
                            {step === 2 && (
                                <div className="flex flex-col gap-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        {(
                                            [
                                                {
                                                    value: 'doador',
                                                    id: 'tipo_doador',
                                                    Icon: UserRound,
                                                    title: 'Quero doar',
                                                    desc: 'Encontre instituições e realize doações com facilidade.',
                                                },
                                                {
                                                    value: 'instituicao',
                                                    id: 'tipo_instituicao',
                                                    Icon: Building2,
                                                    title: 'Represento uma instituição',
                                                    desc: 'Cadastre sua instituição e receba doações da comunidade.',
                                                },
                                            ] as const
                                        ).map(({ value, id, Icon, title, desc }) => (
                                            <label
                                                key={value}
                                                htmlFor={id}
                                                className={cn(
                                                    'flex cursor-pointer flex-col gap-4 rounded-2xl border-2 p-5 transition-all duration-150',
                                                    tipo === value
                                                        ? 'border-brand bg-brand/[0.06]'
                                                        : 'border-border bg-card hover:border-brand/40',
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    id={id}
                                                    name="tipo_usuario"
                                                    value={value}
                                                    className="sr-only"
                                                    onChange={() => handleTipo(value)}
                                                    checked={tipo === value}
                                                />
                                                <div
                                                    className={cn(
                                                        'flex size-12 items-center justify-center rounded-xl transition-colors duration-150',
                                                        tipo === value
                                                            ? 'bg-brand/15 text-brand'
                                                            : 'bg-muted text-muted-foreground',
                                                    )}
                                                >
                                                    <Icon className="size-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {title}
                                                    </p>
                                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                        {desc}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <InputError message={errors.tipo_usuario} />
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11 flex-1"
                                            onClick={prevStep}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            type="button"
                                            className="h-11 flex-1 font-semibold"
                                            onClick={nextStep}
                                            disabled={!tipo}
                                        >
                                            Continuar
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3A — Dados do Doador ── */}
                            {step === 3 && tipo === 'doador' && (
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="nome_completo" className="text-sm font-medium">
                                            Nome completo
                                        </Label>
                                        <Input
                                            id="nome_completo"
                                            type="text"
                                            autoFocus
                                            autoComplete="name"
                                            value={data.nome_completo}
                                            onChange={(e) => setData('nome_completo', e.target.value)}
                                            placeholder="Seu nome completo"
                                            className="h-11"
                                        />
                                        <InputError message={errors.nome_completo} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="cpf" className="text-sm font-medium">
                                            CPF
                                        </Label>
                                        <Input
                                            id="cpf"
                                            type="text"
                                            value={data.cpf}
                                            onChange={(e) => setData('cpf', e.target.value)}
                                            placeholder="000.000.000-00"
                                            className="h-11"
                                        />
                                        <InputError message={errors.cpf} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="telefone" className="text-sm font-medium">
                                            Telefone
                                        </Label>
                                        <Input
                                            id="telefone"
                                            type="tel"
                                            value={data.telefone}
                                            onChange={(e) => setData('telefone', e.target.value)}
                                            placeholder="(00) 00000-0000"
                                            className="h-11"
                                        />
                                        <InputError message={errors.telefone} />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11 flex-1"
                                            onClick={prevStep}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            type="button"
                                            className="h-11 flex-1 font-semibold"
                                            onClick={nextStep}
                                        >
                                            Próximo
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3B — Dados da Instituição ── */}
                            {step === 3 && tipo === 'instituicao' && (
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="nome_fantasia" className="text-sm font-medium">
                                            Nome fantasia
                                        </Label>
                                        <Input
                                            id="nome_fantasia"
                                            type="text"
                                            autoFocus
                                            value={data.nome_fantasia}
                                            onChange={(e) => setData('nome_fantasia', e.target.value)}
                                            placeholder="Nome da instituição"
                                            className="h-11"
                                        />
                                        <InputError message={errors.nome_fantasia} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="razao_social" className="text-sm font-medium">
                                            Razão social
                                        </Label>
                                        <Input
                                            id="razao_social"
                                            type="text"
                                            value={data.razao_social}
                                            onChange={(e) => setData('razao_social', e.target.value)}
                                            placeholder="Razão social"
                                            className="h-11"
                                        />
                                        <InputError message={errors.razao_social} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="cnpj" className="text-sm font-medium">
                                            CNPJ
                                        </Label>
                                        <Input
                                            id="cnpj"
                                            type="text"
                                            value={data.cnpj}
                                            onChange={(e) => setData('cnpj', e.target.value)}
                                            placeholder="00.000.000/0000-00"
                                            className="h-11"
                                        />
                                        <InputError message={errors.cnpj} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="telefone_inst" className="text-sm font-medium">
                                            Telefone
                                        </Label>
                                        <Input
                                            id="telefone_inst"
                                            type="tel"
                                            value={data.telefone_inst}
                                            onChange={(e) => setData('telefone_inst', e.target.value)}
                                            placeholder="(00) 00000-0000"
                                            className="h-11"
                                        />
                                        <InputError message={errors.telefone} />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="endereco_completo" className="text-sm font-medium">
                                            Endereço completo
                                        </Label>
                                        <Input
                                            id="endereco_completo"
                                            type="text"
                                            value={data.endereco_completo}
                                            onChange={(e) => setData('endereco_completo', e.target.value)}
                                            placeholder="Rua, número, bairro, cidade"
                                            className="h-11"
                                        />
                                        <InputError message={errors.endereco_completo} />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11 flex-1"
                                            onClick={prevStep}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            type="button"
                                            className="h-11 flex-1 font-semibold"
                                            onClick={nextStep}
                                        >
                                            Próximo
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 4 — Causas ── */}
                            {step === 4 && (
                                <div className="flex flex-col gap-5">
                                    <p className="text-sm text-muted-foreground">
                                        Selecione as causas que você deseja apoiar.
                                    </p>
                                    <div className="max-h-60 overflow-y-auto rounded-xl border border-border p-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            {causas?.map((causa) => {
                                                const isSelected = data.causas_apoiadas.includes(causa.id);
                                                return (
                                                    <button
                                                        key={causa.id ?? `causa-${causa.nome}`}
                                                        type="button"
                                                        onClick={() => toggleCausa(causa.id)}
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
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="h-11 flex-1"
                                            onClick={prevStep}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="h-11 flex-1 font-semibold"
                                            disabled={processing || data.causas_apoiadas.length === 0}
                                        >
                                            {processing && <Spinner />}
                                            {processing ? 'Criando...' : 'Finalizar cadastro'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Login link */}
                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            Já tem uma conta?{' '}
                            <TextLink href={login.url()}>
                                Entrar
                            </TextLink>
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Right — Brand panel ─────────────────────── */}
            <BrandPanel />
        </div>
    );
}
