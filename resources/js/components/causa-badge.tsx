import {
    GraduationCap,
    HandHeart,
    HeartPulse,
    Home,
    Leaf,
    PawPrint,
    Shield,
    Tag,
    Utensils,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { Causa } from '@/types';

const iconMap: Record<string, LucideIcon> = {
    'paw':            PawPrint,
    'graduation-cap': GraduationCap,
    'leaf':           Leaf,
    'heartbeat':      HeartPulse,
    'utensils':       Utensils,
    'hand-heart':     HandHeart,
    'users':          Users,
    'home':           Home,
    'shield':         Shield,
};

function CausaIcon({ nome }: { nome: string | null }) {
    if (!nome) return <Tag className="size-3" />;
    const Icon = iconMap[nome] ?? Tag;
    return <Icon className="size-3" />;
}

export function CausaBadge({ causa }: { causa: Causa }) {
    return (
        <Badge variant="secondary" className="gap-1">
            <CausaIcon nome={causa.icone} />
            {causa.nome}
        </Badge>
    );
}
