import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, Package, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { login, redirect, register } from '@/routes';
import { index as instituicoesIndex } from '@/routes/instituicoes';

function useCounter(end: number, duration = 2000, active = false) {
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
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(ease * end));

            if (progress < 1) {
requestAnimationFrame(step);
}
        };
        requestAnimationFrame(step);
    }, [end, duration, active]);

    return count;
}

function StatCounter({ value, suffix = '', label, active }: {
    value: number; suffix?: string; label: string; active: boolean;
}) {
    const count = useCounter(value, 2000, active);

    return (
        <div>
            <span className="font-display block text-5xl font-bold text-brand leading-none md:text-6xl">
                {count.toLocaleString('pt-BR')}{suffix}
            </span>
            <span className="mt-3 block text-sm text-muted-foreground">{label}</span>
        </div>
    );
}

const steps = [
    {
        icon: Users,
        title: 'Crie sua conta',
        description: 'Cadastre-se como doadora ou instituição em menos de 2 minutos.',
    },
    {
        icon: Building2,
        title: 'Encontre instituições',
        description: 'Explore instituições verificadas perto de você e conheça suas causas.',
    },
    {
        icon: Package,
        title: 'Realize uma doação',
        description: 'Escolha uma necessidade, combine a entrega e transforme vidas.',
    },
];

const footerLinkCls =
    'text-sm text-[oklch(0.62_0.018_41.0)] transition-colors duration-150 hover:text-[oklch(0.88_0.02_41.0)]';

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
            { threshold: 0.25 },
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

                <header className="sticky top-0 z-40 border-b border-border bg-warm-neutral/90 backdrop-blur-sm">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <div className="flex items-center gap-2 font-semibold">
                            {/* <div className="flex size-7 items-center justify-center rounded-md bg-brand text-primary-foreground">
                                <Heart className="size-4" />
                            </div> */}
                            <div className="flex aspect-square size-10 items-center justify-center">
                                <AppLogoIcon />
                            </div>
                            <span>Impacta</span>
                        </div>
                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={redirect()}>Ir para o painel</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={login()}>Entrar</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button asChild size="sm">
                                            <Link href={register()}>Cadastrar</Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <section className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:py-32">
                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_320px]">

                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">
                                Plataforma de doações solidárias
                            </p>
                            <h1 className="font-display mt-5 text-[2.75rem] font-bold leading-[1.06] tracking-tight text-foreground md:text-5xl lg:text-[3.375rem]">
                                Conectamos quem quer{' '}
                                <em className="not-italic text-brand">ajudar</em>{' '}
                                com quem{' '}
                                <em className="not-italic text-brand">precisa</em>
                            </h1>
                            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                                Rápido, transparente e humano. Sem burocracia, sem intermediários desnecessários.
                            </p>
                            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                                {canRegister && !auth.user && (
                                    <Button asChild size="lg" className="gap-2">
                                        <Link href={register()}>
                                            Começar a doar
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                )}
                                <Button asChild size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                    <Link href={auth.user ? redirect() : login()}>
                                        {auth.user ? 'Ir para o painel' : 'Já tenho conta'}
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="relative hidden h-80 w-80 shrink-0 lg:block" aria-hidden>
                            <div className="absolute inset-0 rounded-full bg-brand-soft" />
                            <div className="absolute -right-2 top-10 h-20 w-20 rounded-full bg-brand/10" />
                            <div className="absolute -left-3 bottom-12 h-14 w-14 rounded-full bg-brand-green/20" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center">
                                <div>
                                    <span className="font-display block text-5xl font-bold leading-none text-brand">
                                        {stats.doacoes.toLocaleString('pt-BR')}+
                                    </span>
                                    <span className="mt-1 block text-xs text-muted-foreground">doações realizadas</span>
                                </div>
                                <div className="h-px w-10 bg-warm-border" />
                                <div>
                                    <span className="font-display block text-3xl font-bold leading-none text-foreground">
                                        {stats.instituicoes}
                                    </span>
                                    <span className="mt-1 block text-xs text-muted-foreground">instituições verificadas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="como-funciona" className="border-y border-border bg-card">
                    <div className="mx-auto max-w-6xl px-6 py-20">
                        <div className="mb-14">
                            <h2 className="font-display text-3xl font-bold md:text-4xl">
                                Como funciona
                            </h2>
                            <p className="mt-3 max-w-sm text-muted-foreground">
                                Três passos simples para fazer a diferença.
                            </p>
                        </div>

                        <div className="grid gap-12 md:grid-cols-3 md:gap-0">
                            {steps.map((step, i) => {
                                const Icon = step.icon;

                                return (
                                    <div key={i} className="relative md:pr-12">
                                        <div className="mb-6 flex items-center">
                                            <div className="h-0.5 w-10 bg-brand" />
                                            <div className="h-px flex-1 bg-border" />
                                        </div>
                                        <span
                                            aria-hidden
                                            className="font-display pointer-events-none select-none text-[5.5rem] font-bold leading-none text-brand/[0.07]"
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div className="-mt-4">
                                            <div className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                                                <Icon className="size-4" />
                                            </div>
                                            <h3 className="mt-4 font-semibold">{step.title}</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section ref={statsRef} className="py-24">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-14 max-w-lg">
                            <h2 className="font-display text-3xl font-bold md:text-4xl">
                                Impacto em números
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                Juntos, já fizemos muito. E ainda há muito mais pela frente.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
                            <StatCounter
                                value={stats.doadoras}
                                suffix="+"
                                label="Doadoras ativas"
                                active={statsVisible}
                            />
                            <div className="sm:border-l sm:border-border sm:pl-12">
                                <StatCounter
                                    value={stats.instituicoes}
                                    label="Instituições verificadas"
                                    active={statsVisible}
                                />
                            </div>
                            <div className="sm:border-l sm:border-border sm:pl-12">
                                <StatCounter
                                    value={stats.doacoes}
                                    suffix="+"
                                    label="Doações realizadas"
                                    active={statsVisible}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {canRegister && !auth.user && (
                    <section className="bg-brand">
                        <div className="mx-auto max-w-6xl px-6 py-24">
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground/50">
                                Pronta para começar?
                            </p>
                            <h2 className="font-display mt-4 max-w-xl text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
                                Faça a diferença hoje mesmo.
                            </h2>
                            <p className="mt-5 max-w-md text-base text-primary-foreground/70 leading-relaxed">
                                Junte-se à rede Impacta e conecte sua generosidade com quem precisa de apoio.
                            </p>
                            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Button
                                    asChild
                                    size="lg"
                                    className="gap-2 bg-card font-semibold text-brand hover:bg-card/90"
                                >
                                    <Link href={register()}>
                                        Criar conta gratuita
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="ghost"
                                    className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                                >
                                    <Link href={login()}>Já tenho conta</Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

                <footer className="bg-[oklch(0.17_0.012_41.0)]">
                    <div className="mx-auto max-w-6xl px-6 py-16">

                        <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-[2fr_1fr_1fr]">

                            <div>
                                <div className="flex items-center gap-2">
                                    {/* <div className="flex size-7 items-center justify-center rounded-md bg-brand text-primary-foreground">
                                        <Heart className="size-4" />
                                    </div> */}
                                    <span className="font-semibold text-[oklch(0.88_0.02_41.0)]">
                                        Impacta
                                    </span>
                                </div>
                                <p className="mt-4 max-w-xs text-sm leading-relaxed text-[oklch(0.65_0.02_41.0)]">
                                    Conectando quem quer ajudar com quem precisa.
                                </p>
                                <p className="mt-1.5 text-xs text-[oklch(0.48_0.012_41.0)]">
                                    Rápido, transparente e humano.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 lg:contents">

                                <div>
                                    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[oklch(0.48_0.012_41.0)]">
                                        Plataforma
                                    </p>
                                    <ul className="mt-4 flex flex-col gap-3">
                                        <li><Link href={instituicoesIndex()} className={footerLinkCls}>Descobrir instituições</Link></li>
                                        <li><a href="#como-funciona" className={footerLinkCls}>Como funciona</a></li>
                                        <li><Link href={login()} className={footerLinkCls}>Entrar</Link></li>
                                        <li><Link href={register()} className={footerLinkCls}>Criar conta</Link></li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[oklch(0.48_0.012_41.0)]">
                                        Institucional
                                    </p>
                                    <ul className="mt-4 flex flex-col gap-3">
                                        <li><Link href={register()} className={footerLinkCls}>Para instituições</Link></li>
                                        <li><a href="#" aria-label="Contato (em breve)" className={footerLinkCls}>Contato</a></li>
                                        <li><a href="#" aria-label="Política de Privacidade (em breve)" className={footerLinkCls}>Política de Privacidade</a></li>
                                        <li><a href="#" aria-label="Termos de Uso (em breve)" className={footerLinkCls}>Termos de Uso</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-white/8 pt-8 text-xs text-[oklch(0.43_0.010_41.0)] sm:flex-row sm:items-center">
                            <p>© {new Date().getFullYear()} Impacta</p>
                            <p>Plataforma de doações solidárias. Comprometida com a LGPD.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
