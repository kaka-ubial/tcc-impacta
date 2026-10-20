<?php

namespace App\Actions\UserTypes\Handlers;

use App\Actions\UserTypes\Contracts\UserTypeHandler;
use App\Models\Instituicao;
use App\Models\User;
use App\Services\GeocodingService;

class InstituicaoHandler implements UserTypeHandler
{
    public function create(User $user, array $data): void
    {
        $coords = app(GeocodingService::class)->resolver($data);

        Instituicao::create([
            'usuario_id' => $user->id,
            'nome_fantasia' => $data['nome_fantasia'],
            'razao_social' => $data['razao_social'],
            'cnpj' => $data['cnpj'],
            'telefone' => $data['telefone_inst'],
            'endereco_completo' => $data['endereco_completo'],
            'latitude' => $coords['lat'],
            'longitude' => $coords['lon'],
            'validada_por_admin' => false,
        ]);

        if (! empty($data['causas_apoiadas'])) {
            $user->causas()->sync($data['causas_apoiadas']);
        }
    }

    public function update(User $user, array $data): void
    {
        $instituicao = $user->instituicao;
        if ($instituicao) {
            $instituicao->atualizarComEndereco([
                'nome_fantasia' => $data['nome_fantasia'],
                'razao_social' => $data['razao_social'],
                'cnpj' => $data['cnpj'],
                'telefone' => $data['telefone_inst'],
                'endereco_completo' => $data['endereco_completo'],
            ], $data);
        }
    }
}
