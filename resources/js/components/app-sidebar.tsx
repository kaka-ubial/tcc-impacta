import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    Gift,
    LayoutGrid,
    LayoutDashboard,
    Box,
    CalendarClock,
    Bell,
    ArrowLeftRight,
    Users,
    Pin,
    PinOff,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import admin from '@/routes/admin';
import { index as doacoesIndex } from '@/routes/doacoes';
import { index as instituicoesIndex } from '@/routes/instituicoes';
import type { NavItem } from '@/types';

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
    {
        title: 'Usuários',
        href: admin.users.index(),
        icon: Users,
    },
];

export function AppSidebar() {
    const { auth, notificacoes_nao_lidas } = usePage().props as any;
    const tipo: string = auth.user.tipo_usuario;
    const naoLidas: number = notificacoes_nao_lidas ?? 0;
    const { open: fixado, toggleSidebar } = useSidebar();

    const baseItems: NavItem[] =
        tipo === 'admin'
            ? adminNavItems
            : tipo === 'instituicao'
              ? instituicaoNavItems
              : doadorNavItems;

    const navItems: NavItem[] =
        tipo === 'admin'
            ? baseItems
            : [
                  ...baseItems,
                  {
                      title:
                          naoLidas > 0
                              ? `Notificações (${naoLidas})`
                              : 'Notificações',
                      href: '/notificacoes',
                      icon: Bell,
                  },
              ];

    const homeHref =
        tipo === 'instituicao' ? '/instituicao/painel' : instituicoesIndex();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <div className="flex items-center gap-1">
                    <SidebarMenu className="min-w-0 flex-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href={homeHref} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
                        aria-pressed={fixado}
                        aria-label={
                            fixado ? 'Soltar menu' : 'Manter menu aberto'
                        }
                        title={fixado ? 'Soltar menu' : 'Manter menu aberto'}
                        onClick={toggleSidebar}
                    >
                        {fixado ? (
                            <PinOff aria-hidden="true" />
                        ) : (
                            <Pin aria-hidden="true" />
                        )}
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>
        </Sidebar>
    );
}
