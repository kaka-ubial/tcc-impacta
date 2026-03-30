<?php

namespace App\Actions\UserTypes\Handlers;

use App\Actions\UserTypes\Contracts\UserTypeHandler;
use App\Models\Instituicao;
use App\Models\User;

class InstituicaoHandler implements UserTypeHandler {
    public function create(User $user, array $data): void {
        Instituicao::create([
            'usuario_id'         => $user->id,
            'nome_fantasia'      => $data['nome_fantasia'],
            'razao_social'       => $data['razao_social'],
            'cnpj'               => $data['cnpj'],
            'telefone'           => $data['telefone_inst'],
            'endereco_completo'  => $data['endereco_completo'],
            'validada_por_admin' => false,
        ]);

        if (!empty($data['causas_apoiadas'])) {
            $user->causas()->sync($data['causas_apoiadas']);        
        }
    }

    public function update(User $user, array $data): void
    {
        $user->instituicao()->update([
            'nome_fantasia' => $data['nome_fantasia'],
            'razao_social' => $data['razao_social'],
            'cnpj' => $data['cnpj'],
            'telefone' => $data['telefone_inst'],
            'endereco_completo' => $data['endereco_completo'],
        ]);
    }
}