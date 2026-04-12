import { Head, usePage, Link } from '@inertiajs/react';
import { Calendar, ChevronRight, Gift, Package, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Painel', href: '/instituicao/painel' },
];

type PainelItem = {
    title: string;
    description: string;
    icon: React.ElementType;
    href?: string | null;
};

const painelItems: PainelItem[] = [
    {
        title: 'Perfil da Instituição',
        description: 'Visualize e edite as informações cadastrais da sua instituição.',
        icon: UserCog,
        href: null,
    },
    {
        title: 'Necessidades',
        description: 'Gerencie as necessidades de doação ativas da sua instituição.',
        icon: Package,
        href: '/instituicao/necessidades',
    },
    {
        title: 'Agendamentos',
        description: 'Acompanhe os agendamentos de entrega de doações.',
        icon: Calendar,
        href: null,
    },
    {
        title: 'Doações Recebidas',
        description: 'Veja o histórico de doações recebidas e seus detalhes.',
        icon: Gift,
        href: null,
    },
];

export default function Painel() {
    const { auth } = usePage().props as any;
    const nomeInstituicao: string = auth.user.instituicao?.nome_fantasia ?? 'Instituição';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Painel" />

            <div className="flex flex-col gap-8 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">
                        Bem-vindo, {nomeInstituicao}!
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        O que você gostaria de fazer hoje?
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {painelItems.map((item) => {
                        const Icon = item.icon;
                        const isAvailable = item.href !== null;

                        const content = (
                            <Card
                                className={[
                                    'h-full transition-shadow',
                                    isAvailable
                                        ? 'cursor-pointer hover:shadow-md'
                                        : 'opacity-60',
                                ].join(' ')}
                            >
                                <CardHeader className="pb-3">
                                    <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-lg">
                                        <Icon className="size-5" />
                                    </div>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        {item.title}
                                        {isAvailable && (
                                            <ChevronRight className="text-muted-foreground size-4" />
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{item.description}</CardDescription>
                                    {!isAvailable && (
                                        <span className="text-muted-foreground mt-3 inline-block text-xs">
                                            Em breve
                                        </span>
                                    )}
                                </CardContent>
                            </Card>
                        );

                        if (isAvailable) {
                            return (
                                <Link key={item.title} href={item.href!}>
                                    {content}
                                </Link>
                            );
                        }

                        return <div key={item.title}>{content}</div>;
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
