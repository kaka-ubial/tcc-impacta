import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { fotoUrl } from '@/lib/foto';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();
    const avatarSrc = fotoUrl(user.doador?.foto_perfil ?? null);

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                {avatarSrc && <AvatarImage src={avatarSrc} alt={user.email} />}
                <AvatarFallback className="rounded-lg bg-muted text-foreground">
                    {getInitials(user.email)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.doador?.nome_completo ?? user.email}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
