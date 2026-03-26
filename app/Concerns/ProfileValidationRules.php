<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'email'             => $this->emailRules($userId),
            'tipo_usuario'      => ['required', 'in:doador,instituicao'],
            'nome_completo'     => ['exclude_unless:tipo_usuario,doador', 'required', 'string', 'max:255'],
            'cpf'               => ['exclude_unless:tipo_usuario,doador', 'required', 'string', 'max:14'],
            'telefone'          => ['exclude_unless:tipo_usuario,doador', 'required', 'string', 'max:20'],
            'nome_fantasia'     => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:255'],
            'razao_social'      => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:255'],
            'cnpj'              => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:18'],
            'telefone_inst'     => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:20'],
            'endereco_completo' => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'max:255'],
        ];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}
