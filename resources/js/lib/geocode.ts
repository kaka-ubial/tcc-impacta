export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
    try {
        const res = await fetch(
            'https://nominatim.openstreetmap.org/search?' +
                new URLSearchParams({ q: address, format: 'json', limit: '1', countrycodes: 'br' }),
            { headers: { 'Accept': 'application/json' } },
        );
        const data: { lat: string; lon: string }[] = await res.json();

        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
    } catch {
        // Geocoding unavailable — coordinates stay null
    }

    return null;
}
