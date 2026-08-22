<?php

namespace App\Actions\UserTypes\Handlers;

use App\Actions\UserTypes\Contracts\UserTypeHandler;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class DoadorHandler implements UserTypeHandler {

    public function create(User $user, array $data): void
    {
        $coords = $this->resolveCoords($data);

        \App\Models\Doador::create([
            'usuario_id'            => $user->id,
            'nome_completo'         => $data['nome_completo'],
            'cpf'                   => $data['cpf'],
            'telefone'              => $data['telefone'],
            'endereco_completo'     => $data['endereco_completo'] ?? null,
            'pontuacao_gamificacao' => 0,
            'exibir_em_transparencia' => false,
            'latitude'              => $coords['lat'],
            'longitude'             => $coords['lon'],
        ]);

        if (!empty($data['causas_apoiadas'])) {
            $user->causas()->sync($data['causas_apoiadas']);
        }
    }

    public function update(User $user, array $data): void
    {
        $coords = $this->resolveCoords($data);

        $atributos = [
            'nome_completo'     => $data['nome_completo'],
            'cpf'               => $data['cpf'],
            'telefone'          => $data['telefone'],
            'endereco_completo' => $data['endereco_completo'] ?? null,
            'latitude'          => $coords['lat'],
            'longitude'         => $coords['lon'],
        ];

        if (array_key_exists('exibir_em_transparencia', $data)) {
            $atributos['exibir_em_transparencia'] = (bool) $data['exibir_em_transparencia'];
        }

        $user->doador()->update($atributos);

        if (array_key_exists('causas_submitted', $data)) {
            $user->causas()->sync($data['causas_apoiadas'] ?? []);
        }
    }

    private function resolveCoords(array $data): array
    {
        // GPS coordinates from the browser take priority
        if (!empty($data['latitude']) && !empty($data['longitude'])) {
            return ['lat' => $data['latitude'], 'lon' => $data['longitude']];
        }

        // Geocode from the address query sent by the frontend
        if (!empty($data['geocoding_query'])) {
            return $this->geocode($data['geocoding_query']) ?? ['lat' => null, 'lon' => null];
        }

        return ['lat' => null, 'lon' => null];
    }

    private function geocode(string $query): ?array
    {
        try {
            $response = Http::withOptions(['verify' => false])
                ->timeout(5)
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q'            => $query,
                    'format'       => 'json',
                    'limit'        => 1,
                    'countrycodes' => 'br',
                ]);

            $results = $response->json();
            if (!empty($results)) {
                return ['lat' => (float) $results[0]['lat'], 'lon' => (float) $results[0]['lon']];
            }
        } catch (\Throwable) {
            // Geocoding unavailable — coordinates stay null
        }

        return null;
    }
}
