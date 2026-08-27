import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Bell,
    Box,
    Building2,
    Calendar,
    CalendarClock,
    Gift,
    LayoutDashboard,
    LayoutGrid,
    Menu,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, NavItem } from '@/types';
import admin from '@/routes/admin';
import { index as doacoesIndex } from '@/routes/doacoes';
import { index as instituicoesIndex } from '@/routes/instituicoes';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const doadorNavItems: NavItem[] = [
    {
        title: 'Instituições',
        href: instituicoesIndex(),
        icon: LayoutGrid,
    },
    {
        title: 'Minhas Doações',
        href: doacoesIndex(),
        icon: Gift,
    },
];

const instituicaoNavItems: NavItem[] = [
    {
        title: 'Painel',
        href: '/instituicao/painel',
        icon: LayoutDashboard,
    },
    {
        title: 'Necessidades',
        href: '/instituicao/necessidades',
        icon: Box,
    },
    {
        title: 'Horários Disponíveis',
        href: '/instituicao/horarios',
        icon: Calendar,
    },
    {
        title: 'Agenda',
        href: '/instituicao/agenda',
        icon: CalendarClock,
    },
    {
        title: 'Doações Recebidas',
        href: '/instituicao/doacoes',
        icon: Gift,
    },
    {
        title: 'Transferências',
        href: '/instituicao/transferencias',
        icon: ArrowLeftRight,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Instituições Pendentes',
        href: admin.institutions.index(),
        icon: Building2,
    },
];

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth, notificacoes_nao_lidas } = page.props as any;
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();

    const tipo: string = auth.user.tipo_usuario;
    const naoLidas: number = notificacoes_nao_lidas ?? 0;

    const navItems: NavItem[] =
        tipo === 'admin'
            ? adminNavItems
            : tipo === 'instituicao'
              ? instituicaoNavItems
              : doadorNavItems;

    const homeHref =
        tipo === 'instituicao' ? '/instituicao/painel' : instituicoesIndex();

    const notificacoesAtivo = isCurrentUrl('/notificacoes');

    return (
        <>
            <div className="sticky top-0 z-50 border-b border-border bg-card">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:px-6">
                    {/* Mobile menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="-ml-2"
                                    aria-label="Abrir menu de navegação"
                                >
                                    <Menu className="size-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex w-72 flex-col gap-6 bg-card p-0"
                            >
                                <SheetTitle className="sr-only">
                                    Menu de navegação
                                </SheetTitle>
                                <SheetHeader className="border-b border-border px-5 py-4">
                                    <Link href={homeHref} className="flex items-center gap-2">
                                        <AppLogoIcon className="size-7" />
                                        <span className="text-sm font-semibold text-foreground">
                                            Impacta
                                        </span>
                                    </Link>
                                </SheetHeader>
                                <nav className="flex flex-col gap-1 px-3">
                                    {navItems.map((item) => {
                                        const ativo = isCurrentUrl(item.href);

                                        return (
                                            <Link
                                                key={item.title}
                                                href={item.href}
                                                data-slot="topbar-link"
                                                data-active={ativo || undefined}
                                                className="flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm text-muted-foreground"
                                            >
                                                {item.icon && <item.icon className="size-4" />}
                                                <span>{item.title}</span>
                                            </Link>
                                        );
                                    })}
                                    {tipo !== 'admin' && (
                                        <Link
                                            href="/notificacoes"
                                            data-slot="topbar-link"
                                            data-active={notificacoesAtivo || undefined}
                                            className="flex items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm text-muted-foreground"
                                        >
                                            <Bell className="size-4" />
                                            <span>Notificações</span>
                                            {naoLidas > 0 && (
                                                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-brand text-[0.715rem] font-semibold text-primary-foreground">
                                                    {naoLidas}
                                                </span>
                                            )}
                                        </Link>
                                    )}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Logo */}
                    <Link
                        href={homeHref}
                        prefetch
                        className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-80"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop nav */}
                    <nav className="ml-4 hidden items-center gap-1 lg:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                prefetch
                                data-slot="topbar-link"
                                data-active={isCurrentUrl(item.href) || undefined}
                                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm whitespace-nowrap text-muted-foreground"
                            >
                                {item.icon && <item.icon className="hidden size-4 xl:block" />}
                                <span>{item.title}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div className="ml-auto flex items-center gap-1">
                        {tipo !== 'admin' && (
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                aria-label={
                                    naoLidas > 0
                                        ? `Notificações (${naoLidas} não lidas)`
                                        : 'Notificações'
                                }
                                className={cn(
                                    'relative',
                                    notificacoesAtivo && 'bg-brand/11 text-brand hover:bg-brand/15 hover:text-brand',
                                )}
                            >
                                <Link href="/notificacoes">
                                    <Bell className="size-[1.15rem]" />
                                    {naoLidas > 0 && (
                                        <span className="absolute top-0.5 right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-brand px-1 text-[0.715rem] font-semibold text-primary-foreground">
                                            {naoLidas > 9 ? '9+' : naoLidas}
                                        </span>
                                    )}
                                </Link>
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="ml-1 size-10 rounded-full p-1"
                                    aria-label="Menu da conta"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.email}
                                        />
                                        <AvatarFallback className="rounded-full bg-brand/12 text-xs font-semibold text-brand">
                                            {getInitials(auth.user.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-border">
                    <div className="mx-auto flex h-11 w-full max-w-7xl items-center px-4 text-muted-foreground sm:px-6">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
