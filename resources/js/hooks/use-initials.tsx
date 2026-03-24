import { useCallback } from 'react';

export type GetInitialsFn = (email: string) => string;

export function useInitials(): GetInitialsFn {
    return useCallback((email: string): string => {
        if (!email) return '';
        return email.charAt(0).toUpperCase();
    }, []);
}
