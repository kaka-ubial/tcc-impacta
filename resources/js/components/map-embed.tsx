import 'maplibre-gl/dist/maplibre-gl.css';
import {
    MapLibreMap,
    Marker,
    NavigationControl,
    Popup,
    setWorkerUrl,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useRef, useState } from 'react';

// O MapLibre 6 acha o próprio worker por um caminho relativo que o Vite não
// rastreia (quebra no dev e some no build). `?worker&url` faz o Vite
// empacotar o worker e devolver a URL certa.
setWorkerUrl(workerUrl);

// OpenFreeMap: tiles vetoriais gratuitos e sem chave
// (https://openfreemap.org). O estilo acompanha o tema claro/escuro do app.
const ESTILOS = {
    claro: 'https://tiles.openfreemap.org/styles/liberty',
    escuro: 'https://tiles.openfreemap.org/styles/dark',
};

const LOCALE = {
    'Map.Title': 'Mapa',
    'NavigationControl.ZoomIn': 'Aproximar',
    'NavigationControl.ZoomOut': 'Afastar',
    'NavigationControl.ResetBearing': 'Arraste para girar o mapa',
    'Popup.Close': 'Fechar',
    'AttributionControl.ToggleAttribution': 'Mostrar créditos',
    'AttributionControl.MapFeedback': 'Sugerir correção no mapa',
    'LogoControl.Title': 'Logo do MapLibre',
    'CooperativeGesturesHandler.WindowsHelpText':
        'Use Ctrl + rolagem para dar zoom no mapa',
    'CooperativeGesturesHandler.MacHelpText':
        'Use ⌘ + rolagem para dar zoom no mapa',
    'CooperativeGesturesHandler.MobileHelpText':
        'Use dois dedos para mover o mapa',
};

function temaEscuro() {
    return document.documentElement.classList.contains('dark');
}

// Cor da marca do tema atual (token --brand do app.css).
function corDaMarca() {
    return (
        getComputedStyle(document.documentElement)
            .getPropertyValue('--brand')
            .trim() || '#3a7d7a'
    );
}

// MapLibre desenha com WebGL; sem ele (aceleração de hardware desligada,
// navegador antigo) mostramos um aviso no lugar do mapa.
function suportaWebGL() {
    try {
        const canvas = document.createElement('canvas');

        return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
    } catch {
        return false;
    }
}

type Props = {
    lat: number;
    lng: number;
    label: string;
};

export default function MapEmbed({ lat, lng, label }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [semWebGL] = useState(
        () => typeof window !== 'undefined' && !suportaWebGL(),
    );

    useEffect(() => {
        if (!containerRef.current || semWebGL) {
            return;
        }

        let map: MapLibreMap;

        try {
            map = new MapLibreMap({
                container: containerRef.current,
                style: temaEscuro() ? ESTILOS.escuro : ESTILOS.claro,
                center: [lng, lat],
                zoom: 16,
                pitch: 40,
                // Não sequestra a rolagem da página: zoom só com Ctrl/⌘ e,
                // no celular, mover só com dois dedos.
                cooperativeGestures: true,
                attributionControl: { compact: true },
                locale: LOCALE,
            });
        } catch {
            // WebGL disponível, mas o contexto falhou ao ser criado — o
            // container fica vazio e o link "Abrir no mapa" continua lá.
            return;
        }

        map.addControl(
            new NavigationControl({ visualizePitch: true }),
            'top-left',
        );

        // O endereço é digitado pelo usuário: setText, nunca HTML.
        // focusAfterOpen: false — o popup abre sozinho no load; com foco, o
        // navegador rolaria a página até o mapa (que fica no fim do perfil).
        const popup = new Popup({
            offset: 32,
            closeButton: true,
            focusAfterOpen: false,
        }).setText(label);

        let marker = new Marker({ color: corDaMarca() })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);

        map.once('load', () => marker.togglePopup());

        // Troca de tema no app (classe .dark no <html>) → troca o estilo do
        // mapa e recolore o marcador.
        let escuro = temaEscuro();
        const observer = new MutationObserver(() => {
            if (temaEscuro() === escuro) {
                return;
            }

            escuro = temaEscuro();
            map.setStyle(escuro ? ESTILOS.escuro : ESTILOS.claro);
            marker.remove();
            marker = new Marker({ color: corDaMarca() })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map);
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => {
            observer.disconnect();
            map.remove();
        };
    }, [lat, lng, label, semWebGL]);

    if (semWebGL) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground">
                Não foi possível carregar o mapa neste navegador. Use o link
                “Abrir no mapa” abaixo.
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="h-full w-full"
            role="region"
            aria-label={`Mapa: ${label}`}
        />
    );
}
