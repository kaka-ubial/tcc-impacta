import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Claro' },
        { value: 'dark', icon: Moon, label: 'Escuro' },
        { value: 'system', icon: Monitor, label: 'Sistema' },
    ];

    return (
        <div className={cn('inline-flex', className)} {...props}>
            <ToggleGroup
                type="single"
                value={appearance}
                onValueChange={(v) => v && updateAppearance(v as Appearance)}
            >
                {tabs.map(({ value, icon: Icon, label }) => (
                    <ToggleGroupItem key={value} value={value} className="gap-1.5 px-3.5">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{label}</span>
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
    );
}
