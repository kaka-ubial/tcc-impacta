<?php

namespace App\Http\Requests\Instituicao;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação da avaliação que a instituição registra sobre uma doação recebida.
 * Reaproveitada pelo controller Inertia (Instituicao\AvaliacaoController) e pelo
 * de API (Api\Instituicao\AvaliacaoController).
 */
class StoreAvaliacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'nota' => ['required', 'integer', 'min:1', 'max:5'],
            'descricao' => ['string', 'max:1000', 'required'],
        ];
    }
}
