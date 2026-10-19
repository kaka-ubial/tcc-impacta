import { useSyncExternalStore } from 'react';

export type AccessibilityPreferences = {
    fontScale: 100 | 125 | 150 | 200;
    highContrast: boolean;
    reduceMotion: boolean;
    underlineLinks: boolean;
    strongFocus: boolean;
    announceNavigation: boolean;
};

export const defaultAccessibility: AccessibilityPreferences = {
    fontScale: 100,
    highContrast: false,
    reduceMotion: false,
    underlineLinks: false,
    strongFocus: false,
    announceNavigation: true,
};

const STORAGE_KEY = 'accessibility';

const listeners = new Set<() => void>();
let current: AccessibilityPreferences = defaultAccessibility;

const read = (): AccessibilityPreferences => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        return raw
            ? { ...defaultAccessibility, ...JSON.parse(raw) }
            : defaultAccessibility;
    } catch {
        return defaultAccessibility;
    }
};

const apply = (prefs: AccessibilityPreferences): void => {
    const root = document.documentElement;

    root.style.fontSize = prefs.fontScale === 100 ? '' : `${prefs.fontScale}%`;
    root.classList.toggle('a11y-contrast', prefs.highContrast);
    root.classList.toggle('a11y-reduce-motion', prefs.reduceMotion);
    root.classList.toggle('a11y-underline', prefs.underlineLinks);
    root.classList.toggle('a11y-focus', prefs.strongFocus);
};

export function initializeAccessibility(): void {
    if (typeof window === 'undefined') {
        return;
    }

    current = read();
    apply(current);
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
};

export function useAccessibility() {
    const preferences = useSyncExternalStore(
        subscribe,
        () => current,
        () => defaultAccessibility,
    );

    const update = (patch: Partial<AccessibilityPreferences>): void => {
        current = { ...current, ...patch };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        } catch {
            void 0;
        }

        apply(current);
        listeners.forEach((listener) => listener());
    };

    const reset = (): void => update(defaultAccessibility);

    return { preferences, update, reset } as const;
}
