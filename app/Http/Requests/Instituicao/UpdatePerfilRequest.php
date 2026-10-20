<?php

namespace App\Http\Requests\Instituicao;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Campos editáveis direto no perfil da instituição. Cada bloco da página
 * (sobre / causas) envia só o próprio campo, por isso tudo é `sometimes`.
 * Dados cadastrais (CNPJ, razão social, endereço...) continuam em
 * Configurações > Perfil (ProfileUpdateRequest).
 */
class UpdatePerfilRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'descricao' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'causas' => ['sometimes', 'array'],
            'causas.*' => ['integer', 'exists:causas,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'descricao.max' => 'A descrição pode ter no máximo 2000 caracteres.',
            'causas.*.exists' => 'Causa inválida.',
        ];
    }
}
