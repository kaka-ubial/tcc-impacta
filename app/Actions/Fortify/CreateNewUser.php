<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use App\Models\Doador;
use App\Models\Instituicao;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function create(array $input): User
    {
        Validator::make($input, [
            'email'             => ['required', 'string', 'email', 'max:255', 'unique:usuarios'],
            'password'          => $this->passwordRules(),
            'tipo_usuario'      => ['required', 'in:doador,instituicao'],
            'nome_completo'     => ['exclude_unless:tipo_usuario,doador', 'required', 'string', 'max:255'],
            'cpf'               => ['exclude_unless:tipo_usuario,doador', 'required', 'string', 'max:14'],
            'telefone'          => ['exclude_unless:tipo_usuario,doador', 'required', 'string', 'max:20'],
            'nome_fantasia'     => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:255'],
            'razao_social'      => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:255'],
            'cnpj'              => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:18'],
            'telefone_inst'     => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:20'],
            'endereco_completo' => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:255'],
        ])->validate();

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'email'        => $input['email'],
                'password'     => $input['password'],
                'tipo_usuario' => $input['tipo_usuario'],
                'status'       => $input['tipo_usuario'] === 'instituicao'
                    ? 'aguardando_validacao'
                    : 'ativo',
            ]);

            if ($input['tipo_usuario'] === 'doador') {
                Doador::create([
                    'usuario_id'           => $user->id,
                    'nome_completo'        => $input['nome_completo'],
                    'cpf'                  => $input['cpf'],
                    'telefone'             => $input['telefone'],
                    'pontuacao_gamificacao' => 0,
                ]);
            } else {
                Instituicao::create([
                    'usuario_id'         => $user->id,
                    'nome_fantasia'      => $input['nome_fantasia'],
                    'razao_social'       => $input['razao_social'],
                    'cnpj'               => $input['cnpj'],
                    'telefone'           => $input['telefone_inst'],
                    'endereco_completo'  => $input['endereco_completo'],
                    'validada_por_admin' => false,
                ]);
            }

            return $user;
        });
    }
}
