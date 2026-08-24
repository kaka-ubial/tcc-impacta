<?php

namespace App\Http\Requests\Instituicao;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação do cadastro de um horário disponível. Reaproveitada pelo controller
 * Inertia (Instituicao\HorarioController) e pelo de API (Api\HorarioController).
 */
class StoreHorarioRequest extends FormRequest
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
            'dia_semana' => ['required', 'integer', 'between:0,6'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fim' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'tipo' => ['required', 'in:coleta,entrega'],
        ];
    }
}
