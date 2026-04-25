import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, Heart, Package, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { login, redirect, register } from '@/routes';

function useCounter(end: number, duration = 1800, active = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!active || end === 0) {
return;
}

        let startTime: number | null = null;
        const step = (ts: number) => {
            if (!startTime) {
startTime = ts;
}

            const progress = Math.min((ts - startTime) / duration, 1);
            setCount(Math.floor(progress * end));

            if (progress < 1) {
requestAnimationFrame(step);
}
        };
        requestAnimationFrame(step);
    }, [end, duration, active]);

    return count;
}

function StatCounter({
    value,
    suffix = '',
    label,
    active,
}: {
    value: number;
    suffix?: string;
    label: string;
    active: boolean;
}) {
    const count = useCounter(value, 1800, active);

    return (
        <div className="flex flex-col items-center gap-1">
            <span className="font-display text-4xl font-bold text-brand md:text-5xl">
                {count.toLocaleString('pt-BR')}{suffix}
            </span>
            <span className="text-sm text-muted-foreground">{label}</span>
        </div>
    );
}

const steps = [
    {
        icon: Users,
        title: 'Crie sua conta',
        description:
            'Cadastre-se como doadora ou instituição em menos de 2 minutos.',
    },
    {
        icon: Building2,
        title: 'Encontre instituições',
        description:
            'Explore instituições verificadas perto de você e conheça suas causas.',
    },
    {
        icon: Package,
        title: 'Realize uma doação',
        description:
            'Escolha uma necessidade, combine a entrega e transforme vidas.',
    },
];

export default function Welcome({
    canRegister = true,
    stats = { doadoras: 1240, instituicoes: 87, doacoes: 3560 },
}: {
    canRegister?: boolean;
    stats?: { doadoras: number; instituicoes: number; doacoes: number };
}) {
    const { auth } = usePage().props;
    const statsRef = useRef<HTMLDivElement>(null);
    const [statsVisible, setStatsVisible] = useState(false);

    useEffect(() => {
        const el = statsRef.current;

        if (!el) {
return;
}

        const observer = new IntersectionObserver(
            ([entry]) => {
 if (entry.isIntersecting) {
setStatsVisible(true);
} 
},
            { threshold: 0.3 },
        );
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <Head title="Impacta — Conectando quem quer ajudar com quem precisa">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|playfair-display:700,700i"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-warm-neutral text-foreground">
                {/* ── Nav ────────────────────────────────────────── */}
                <header className="sticky top-0 z-40 border-b border-border bg-warm-neutral/90 backdrop-blur-sm">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <div className="flex items-center gap-2 font-semibold">
                            <div className="flex size-7 items-center justify-center rounded-md bg-brand text-primary-foreground">
                                <Heart className="size-4" />
                            </div>
                            <span>Impacta</span>
                        </div>

                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={redirect()}>Ir para o painel</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button asChild variant="ghost">
                                        <Link href={login()}>Entrar</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild>
                                            <Link href={register()}>Cadastrar</Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* ── Hero ───────────────────────────────────────── */}
                <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="mb-4 inline-block rounded-full bg-brand-soft px-4 py-1 text-sm font-medium text-brand">
                            Plataforma de doações solidárias
                        </span>
                        <h1 className="font-display mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
                            Transforme intenção em{' '}
                            <em className="not-italic text-brand">impacto real</em>
                        </h1>
                        <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                            O Impacta conecta pessoas que querem doar com instituições que
                            precisam de apoio. Rápido, transparente e humano.
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            {canRegister && !auth.user && (
                                <Button asChild size="lg" className="gap-2 text-base">
                                    <Link href={register()}>
                                        Começar a doar
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                            )}
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="text-base"
                            >
                                <Link href={auth.user ? redirect() : login()}>
                                    {auth.user ? 'Ir para o painel' : 'Já tenho conta'}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Decorative warm shape */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-brand-soft/40 blur-3xl"
                    />
                </section>

                {/* ── Como funciona ──────────────────────────────── */}
                <section className="bg-card py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-12 text-center">
                            <h2 className="font-display text-3xl font-bold md:text-4xl">
                                Como funciona
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Três passos simples para fazer a diferença.
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {steps.map((step, i) => {
                                const Icon = step.icon;

                                return (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background p-8 text-center shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                                            <Icon className="size-6" />
                                        </div>
                                        <div className="flex size-7 items-center justify-center rounded-full bg-brand text-primary-foreground text-sm font-bold">
                                            {i + 1}
                                        </div>
                                        <h3 className="text-lg font-semibold">{step.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {step.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── Stats ──────────────────────────────────────── */}
                <section ref={statsRef} className="py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-12 text-center">
                            <h2 className="font-display text-3xl font-bold md:text-4xl">
                                Impacto em números
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Juntos, já fizemos muito. E ainda há muito mais pela frente.
                            </p>
                        </div>

                        <div className="grid gap-8 rounded-2xl border border-border bg-card p-10 text-center md:grid-cols-3">
                            <StatCounter
                                value={stats.doadoras}
                                suffix="+"
                                label="Doadoras ativas"
                                active={statsVisible}
                            />
                            <StatCounter
                                value={stats.instituicoes}
                                label="Instituições verificadas"
                                active={statsVisible}
                            />
                            <StatCounter
                                value={stats.doacoes}
                                suffix="+"
                                label="Doações realizadas"
                                active={statsVisible}
                            />
                        </div>
                    </div>
                </section>

                {/* ── CTA ────────────────────────────────────────── */}
                {canRegister && !auth.user && (
                    <section className="bg-brand py-20 text-primary-foreground">
                        <div className="mx-auto max-w-3xl px-6 text-center">
                            <h2 className="font-display text-3xl font-bold md:text-4xl">
                                Pronta para fazer a diferença?
                            </h2>
                            <p className="mt-4 text-primary-foreground/80">
                                Junte-se à rede Impacta e conecte sua generosidade com
                                quem mais precisa.
                            </p>
                            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-card text-brand hover:bg-card/90 gap-2 text-base font-semibold"
                                >
                                    <Link href={register()}>
                                        Criar conta gratuita
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 text-base"
                                >
                                    <Link href={login()}>Já tenho conta</Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Footer ─────────────────────────────────────── */}
                <footer className="border-t border-border py-10">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                            <Heart className="size-4 text-brand" />
                            Impacta
                        </div>
                        <p>Conectando quem quer ajudar com quem precisa.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
