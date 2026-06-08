export function fotoUrl(path: string | null | undefined): string | undefined {
    if (!path) {
        return undefined;
    }

    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
        return path;
    }

    return `/storage/${path}`;
}
