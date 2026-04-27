import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

// Fix default marker icons (Leaflet + Vite asset path issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Props = {
    lat: number;
    lng: number;
    label: string;
};

export default function MapEmbed({ lat, lng, label }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) {
return;
}

        const map = L.map(containerRef.current, {
            center: [lat, lng],
            zoom: 16,
            zoomControl: true,
            scrollWheelZoom: false,
        });

        // CartoDB Voyager — design moderno e colorido, gratuito sem API key
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20,
        }).addTo(map);

        L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`<strong>${label}</strong>`)
            .openPopup();

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [lat, lng, label]);

    return <div ref={containerRef} className="h-full w-full" />;
}
