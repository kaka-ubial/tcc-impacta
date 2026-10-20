<?php

namespace App\Actions\UserTypes\Handlers;

use App\Actions\UserTypes\Contracts\UserTypeHandler;
use App\Models\Doador;
use App\Models\User;
use App\Services\GeocodingService;

class DoadorHandler implements UserTypeHandler
{
    public function create(User $user, array $data): void
    {
        $coords = app(GeocodingService::class)->resolver($data);

        Doador::create([
            'usuario_id' => $user->id,
            'nome_completo' => $data['nome_completo'],
            'cpf' => $data['cpf'],
            'telefone' => $data['telefone'],
            'endereco_completo' => $data['endereco_completo'] ?? null,
            'pontuacao_gamificacao' => 0,
            'exibir_em_transparencia' => false,
            'latitude' => $coords['lat'],
            'longitude' => $coords['lon'],
        ]);

        if (! empty($data['causas_apoiadas'])) {
            $user->causas()->sync($data['causas_apoiadas']);
        }
    }

    public function update(User $user, array $data): void
    {
        $coords = app(GeocodingService::class)->resolver($data);

        $atributos = [
            'nome_completo' => $data['nome_completo'],
            'cpf' => $data['cpf'],
            'telefone' => $data['telefone'],
            'endereco_completo' => $data['endereco_completo'] ?? null,
            'latitude' => $coords['lat'],
            'longitude' => $coords['lon'],
        ];

        if (array_key_exists('exibir_em_transparencia', $data)) {
            $atributos['exibir_em_transparencia'] = (bool) $data['exibir_em_transparencia'];
        }

        $user->doador()->update($atributos);

        if (array_key_exists('causas_submitted', $data)) {
            $user->causas()->sync($data['causas_apoiadas'] ?? []);
        }
    }
}
