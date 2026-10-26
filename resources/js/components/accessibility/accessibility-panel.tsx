import type { LucideIcon } from 'lucide-react';
import { Accessibility, Contrast, Moon, RotateCcw, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useAccessibility } from '@/hooks/use-accessibility';
import type { AccessibilityPreferences } from '@/hooks/use-accessibility';
import { useAppearance } from '@/hooks/use-appearance';

const fontScales: AccessibilityPreferences['fontScale'][] = [
    100, 125, 150, 200,
];

type ThemeOption = 'light' | 'dark' | 'contrast';

const themes: { value: ThemeOption; label: string; icon: LucideIcon }[] = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'contrast', label: 'Alto contraste', icon: Contrast },
];

const toggles: {
    key: Exclude<keyof AccessibilityPreferences, 'fontScale' | 'highContrast'>;
    label: string;
    hint: string;
}[] = [
    {
        key: 'colorBlindMode',
        label: 'Modo para daltonismo',
        hint: 'Paleta que não depende de verde x vermelho, com status também em ícones.',
    },
    {
        key: 'underlineLinks',
        label: 'Sublinhar links',
        hint: 'Links não dependem só da cor.',
    },
    {
        key: 'strongFocus',
        label: 'Foco reforçado',
        hint: 'Contorno grande no item focado pelo teclado.',
    },
    {
        key: 'reduceMotion',
        label: 'Reduzir animações',
        hint: 'Remove transições e contadores animados.',
    },
    {
        key: 'announceNavigation',
        label: 'Anunciar troca de página',
        hint: 'O leitor de tela fala o título da nova página.',
    },
];

export function AccessibilityPanel() {
    const { preferences, update, reset } = useAccessibility();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const activeTheme: ThemeOption = preferences.highContrast
        ? 'contrast'
        : resolvedAppearance;

    const selectTheme = (theme: ThemeOption): void => {
        if (theme === 'contrast') {
            update({ highContrast: true });

            return;
        }

        update({ highContrast: false });
        updateAppearance(theme);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    variant="outline"
                    aria-label="Abrir opções de acessibilidade"
                    className="fixed right-4 bottom-4 z-50 size-11 rounded-full shadow-lg"
                >
                    <Accessibility aria-hidden="true" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                side="top"
                className="w-80"
                aria-label="Opções de acessibilidade"
            >
                <h2 className="mb-3 text-base font-semibold">Acessibilidade</h2>

                <fieldset className="mb-4">
                    <legend className="mb-2 text-sm font-medium">
                        Tamanho do texto
                    </legend>
                    <div className="grid grid-cols-4 gap-2">
                        {fontScales.map((scale) => (
                            <Button
                                key={scale}
                                type="button"
                                size="sm"
                                variant={
                                    preferences.fontScale === scale
                                        ? 'default'
                                        : 'outline'
                                }
                                aria-pressed={preferences.fontScale === scale}
                                aria-label={`Texto em ${scale} por cento`}
                                onClick={() => update({ fontScale: scale })}
                            >
                                {scale}%
                            </Button>
                        ))}
                    </div>
                </fieldset>

                <fieldset className="mb-4">
                    <legend className="mb-2 text-sm font-medium">Tema</legend>
                    <div className="grid grid-cols-2 gap-2">
                        {themes.map(({ value, label, icon: Icon }) => (
                            <Button
                                key={value}
                                type="button"
                                size="sm"
                                variant={
                                    activeTheme === value
                                        ? 'default'
                                        : 'outline'
                                }
                                className={
                                    value === 'contrast' ? 'col-span-2' : ''
                                }
                                aria-pressed={activeTheme === value}
                                onClick={() => selectTheme(value)}
                            >
                                <Icon aria-hidden="true" />
                                {label}
                            </Button>
                        ))}
                    </div>
                </fieldset>

                <ul className="space-y-3">
                    {toggles.map(({ key, label, hint }) => (
                        <li key={key} className="flex items-start gap-3">
                            <Checkbox
                                id={`a11y-${key}`}
                                checked={preferences[key]}
                                onCheckedChange={(checked) =>
                                    update({ [key]: checked === true })
                                }
                                aria-describedby={`a11y-${key}-hint`}
                                className="mt-0.5"
                            />
                            <div className="grid gap-0.5">
                                <Label htmlFor={`a11y-${key}`}>{label}</Label>
                                <p
                                    id={`a11y-${key}-hint`}
                                    className="text-xs text-muted-foreground"
                                >
                                    {hint}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => {
                        reset();
                        updateAppearance('system');
                    }}
                >
                    <RotateCcw aria-hidden="true" />
                    Restaurar padrão
                </Button>
            </PopoverContent>
        </Popover>
    );
}
