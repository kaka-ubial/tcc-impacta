export function tempoRelativo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);

    if (min < 1) {
        return 'agora';
    }

    if (min < 60) {
        return `há ${min} min`;
    }

    const horas = Math.floor(min / 60);

    if (horas < 24) {
        return `há ${horas} h`;
    }

    const dias = Math.floor(horas / 24);

    if (dias < 7) {
        return `há ${dias} d`;
    }

    return new Date(iso).toLocaleDateString('pt-BR');
}
