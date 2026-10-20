<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Endereço → coordenadas via Nominatim (OpenStreetMap). Gratuito e sem
 * chave, mas a política de uso exige um User-Agent identificando a
 * aplicação e no máximo ~1 requisição/segundo
 * (https://operations.osmfoundation.org/policies/nominatim/).
 */
class GeocodingService
{
    private const URL = 'https://nominatim.openstreetmap.org/search';

    /**
     * Coordenadas para o cadastro de doador/instituição: GPS do navegador
     * tem prioridade; senão geocodifica a query montada pelo frontend
     * (logradouro, número, cidade, UF); por último o endereço completo.
     *
     * @return array{lat: float|null, lon: float|null}
     */
    public function resolver(array $data): array
    {
        if (! empty($data['latitude']) && ! empty($data['longitude'])) {
            return ['lat' => (float) $data['latitude'], 'lon' => (float) $data['longitude']];
        }

        $coords = null;

        if (! empty($data['geocoding_query'])) {
            $coords = $this->geocode($data['geocoding_query']);
        }

        if ($coords === null && ! empty($data['endereco_completo'])) {
            $coords = $this->geocodeEndereco($data['endereco_completo']);
        }

        return $coords ?? ['lat' => null, 'lon' => null];
    }

    /**
     * Endereço no formato salvo pelo app ("Rua X, 123 - Apto 4 - Bairro -
     * Cidade/UF - CEP 00000-000"). O Nominatim costuma não achar a string
     * inteira (complemento e CEP atrapalham), então tenta de novo só com
     * "logradouro, número, cidade, UF".
     *
     * @return array{lat: float, lon: float}|null
     */
    public function geocodeEndereco(string $endereco): ?array
    {
        $coords = $this->geocode($endereco);

        if ($coords !== null) {
            return $coords;
        }

        $partes = array_map('trim', explode(' - ', $endereco));

        foreach ($partes as $parte) {
            if (preg_match('#^(.+)/([A-Z]{2})$#u', $parte, $m)) {
                return $this->geocode("{$partes[0]}, {$m[1]}, {$m[2]}, Brasil");
            }
        }

        return null;
    }

    /**
     * @return array{lat: float, lon: float}|null
     */
    public function geocode(string $query): ?array
    {
        try {
            $results = Http::withUserAgent(config('app.name').' (geocoding de endereços)')
                ->timeout(5)
                ->get(self::URL, [
                    'q' => $query,
                    'format' => 'json',
                    'limit' => 1,
                    'countrycodes' => 'br',
                ])
                ->json();

            if (! empty($results)) {
                return ['lat' => (float) $results[0]['lat'], 'lon' => (float) $results[0]['lon']];
            }
        } catch (\Throwable) {
            // Geocoding indisponível — coordenadas ficam null
        }

        return null;
    }
}
