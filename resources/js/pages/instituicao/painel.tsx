import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Calendar, Gift, Package, UserCog } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: '/instituicao/painel' },
];

type PainelItem = {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string | null;
    accent: string;
    accentText: string;
};

const painelItems: PainelItem[] = [
    {
        title: 'Doações Recebidas',
        description: 'Avalie as solicitações de doação pendentes e gerencie o histórico de recebimentos.',
        icon: Gift,
        href: '/instituicao/doacoes',
        accent: 'bg-brand/10',
        accentText: 'text-brand',
    },
    {
        title: 'Necessidades',
        description: 'Cadastre e gerencie os itens que sua instituição precisa receber.',
        icon: Package,
        href: '/instituicao/necessidades',
        accent: 'bg-brand-green/10',
        accentText: 'text-brand-green',
    },
    {
        title: 'Horários Disponíveis',
        description: 'Configure os dias e horários em que aceita receber ou coletar doações.',
        icon: Calendar,
        href: '/instituicao/horarios',
        accent: 'bg-pending/10',
        accentText: 'text-pending',
    },
    {
        title: 'Perfil da Instituição',
        description: 'Visualize e edite as informações cadastrais da sua instituição.',
        icon: UserCog,
        href: null,
        accent: 'bg-muted',
        accentText: 'text-muted-foreground',
    },
];

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

export default function Painel() {
    const { auth } = usePage().props as any;
    const nomeInstituicao: string =
        auth.user.instituicao?.nome_fantasia ?? 'Instituição';

    const available = painelItems.filter((i) => i.href !== null);
    const unavailable = painelItems.filter((i) => i.href === null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Painel" />

            <div className="flex flex-col gap-0">

                {/* ── Welcome banner ──────────────────────────── */}
                <div className="border-b border-border bg-card px-6 py-10">
                    <div className="mx-auto max-w-4xl">
                        <p className="text-sm text-muted-foreground">{getGreeting()},</p>
                        <h1 className="font-display mt-1 text-3xl font-bold text-foreground md:text-4xl">
                            {nomeInstituicao}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            O que você gostaria de fazer hoje?
                        </p>
                    </div>
                </div>

                {/* ── Action cards ────────────────────────────── */}
                <div className="mx-auto w-full max-w-4xl px-6 py-8">

                    {/* Primary actions */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {available.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.title}
                                    href={item.href!}
                                    className="group focus-visible:outline-none"
                                >
                                    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-brand/30 hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                        <div className={`flex size-10 items-center justify-center rounded-xl ${item.accent} ${item.accentText} mb-5`}>
                                            <Icon className="size-5" />
                                        </div>
                                        <h2 className="font-semibold text-foreground group-hover:text-brand transition-colors">
                                            {item.title}
                                        </h2>
                                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                                            {item.description}
                                        </p>
                                        <div className="mt-5 flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                                            Acessar
                                            <ArrowRight className="size-3.5" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Unavailable items */}
                    {unavailable.length > 0 && (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {unavailable.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.title}
                                        className="flex flex-col rounded-2xl border border-dashed border-border bg-card/50 p-6 opacity-60"
                                    >
                                        <div className={`flex size-10 items-center justify-center rounded-xl ${item.accent} ${item.accentText} mb-5`}>
                                            <Icon className="size-5" />
                                        </div>
                                        <h2 className="font-semibold text-foreground">
                                            {item.title}
                                        </h2>
                                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                                            {item.description}
                                        </p>
                                        <span className="mt-5 text-xs text-muted-foreground">
                                            Em breve
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
