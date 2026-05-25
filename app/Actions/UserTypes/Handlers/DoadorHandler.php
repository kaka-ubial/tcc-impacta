<?php

namespace App\Actions\UserTypes\Handlers;

use App\Actions\UserTypes\Contracts\UserTypeHandler;
use App\Models\User;


class DoadorHandler implements UserTypeHandler {

    public function create(User $user, array $data): void
    {
        \App\Models\Doador::create([
            'usuario_id'             => $user->id,
            'nome_completo'          => $data['nome_completo'],
            'cpf'                    => $data['cpf'],
            'telefone'               => $data['telefone'],
            'endereco_completo'      => $data['endereco_completo'] ?? null,
            'pontuacao_gamificacao'  => 0,
            'latitude'               => $data['latitude'] ?? null,
            'longitude'              => $data['longitude'] ?? null,
        ]);



    }

    public function update(User $user, array $data): void
    {
        $user->doador()->update([
            'nome_completo' => $data['nome_completo'],
            'cpf' => $data['cpf'],
            'telefone' => $data['telefone']
        ]);

    }


}
