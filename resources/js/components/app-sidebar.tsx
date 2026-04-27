import { Link, usePage } from '@inertiajs/react';
import { Building2, Gift, LayoutGrid, LayoutDashboard, Box, Calendar } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
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
        title: 'Horários Disponíveis',
        href: '/instituicao/horarios',
        icon: Calendar,
    },
    {
        title: 'Doações Recebidas',
        href: '/instituicao/doacoes',
        icon: Gift,
    }
];

const adminNavItems: NavItem[] = [
    {
        title: 'Instituições Pendentes',
        href: admin.institutions.index(),
        icon: Building2,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const tipo: string = auth.user.tipo_usuario;

    const navItems: NavItem[] =
        tipo === 'admin'
            ? adminNavItems
            : tipo === 'instituicao'
              ? instituicaoNavItems
              : doadorNavItems;

    const homeHref =
        tipo === 'instituicao'
            ? '/instituicao/painel'
            : instituicoesIndex();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
