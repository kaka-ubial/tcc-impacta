<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;
use App\Rules\Cpf;
use App\Rules\Cnpj;

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
            'nome_completo'     => ['exclude_unless:tipo_usuario,doador', 'required', 'string', 'min:2', 'max:255'],
            'cpf' => [
                'exclude_unless:tipo_usuario,doador',
                'required',
                'string',
                new Cpf(),
            ],
            'telefone'          => ['exclude_unless:tipo_usuario,doador', 'required', 'string', 'regex:/^\(\d{2}\)\s\d{4,5}-\d{4}$/'],
            'nome_fantasia'     => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'min:2', 'max:255'],
            'razao_social'      => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'min:2', 'max:255'],
            'cnpj' => [
                'exclude_unless:tipo_usuario,instituicao',
                'required',
                'string',
                new Cnpj(),
            ],
            'telefone_inst'     => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'regex:/^\(\d{2}\)\s\d{4,5}-\d{4}$/'],
            'endereco_completo' => ['exclude_unless:tipo_usuario,instituicao', 'required', 'string', 'min:10', 'max:500'],
            'causas_apoiadas'   => ['sometimes', 'array', 'min:1'],
            'causas_apoiadas.*' => ['integer', 'exists:causas,id'],
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
