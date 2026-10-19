import { Link, router, usePage } from '@inertiajs/react';
import {
    LogOut,
    Settings,
    ShieldCheck,
    UserCircle,
    UserRound,
} from 'lucide-react';
import { NotificationsMenu } from '@/components/notifications-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import { fotoUrl } from '@/lib/foto';
import { logout } from '@/routes';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { User } from '@/types';

function nomeDe(user: User): string {
    return (
        user.doador?.nome_completo ??
        user.instituicao?.nome_fantasia ??
        user.email
    );
}

export function AppTopbar() {
    const { auth } = usePage().props as unknown as { auth: { user: User } };
    const user = auth.user;
    const getInitials = useInitials();
    const nome = nomeDe(user);
    const foto = fotoUrl(user.doador?.foto_perfil ?? null);
    const iniciais =
        nome
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => getInitials(parte))
            .join('') || getInitials(user.email);

    return (
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
            <div className="md:hidden">
                <SidebarTrigger className="-ml-1" />
            </div>

            <div className="ml-auto flex items-center gap-1">
                <NotificationsMenu />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-full"
                            aria-label="Configurações"
                        >
                            <Settings aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-52">
                        <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link
                                className="w-full cursor-pointer"
                                href={editProfile()}
                                prefetch
                            >
                                <UserRound aria-hidden="true" />
                                Dados da conta
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                className="w-full cursor-pointer"
                                href={editSecurity()}
                                prefetch
                            >
                                <ShieldCheck aria-hidden="true" />
                                Segurança
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label="Menu da conta"
                            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            data-test="sidebar-menu-button"
                        >
                            <Avatar className="size-9">
                                {foto && <AvatarImage src={foto} alt={nome} />}
                                <AvatarFallback className="bg-brand text-sm font-semibold text-primary-foreground">
                                    {iniciais}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-56">
                        <DropdownMenuLabel className="font-normal">
                            <p className="truncate text-sm font-medium">
                                {nome}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                            </p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {user.tipo_usuario === 'doador' && (
                            <DropdownMenuItem asChild>
                                <Link
                                    className="w-full cursor-pointer"
                                    href="/perfil"
                                    prefetch
                                >
                                    <UserCircle aria-hidden="true" />
                                    Ver perfil
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                            <Link
                                className="w-full cursor-pointer"
                                href={logout()}
                                as="button"
                                onClick={() => router.flushAll()}
                                data-test="logout-button"
                            >
                                <LogOut aria-hidden="true" />
                                Sair
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
