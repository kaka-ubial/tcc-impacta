<?php

namespace App\Http\Requests\Instituicao;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação da sugestão de uma nova data — usada tanto na agenda de doações
 * (Agenda*Controller::sugerirAlteracao) quanto nas transferências
 * (Transferencia*Controller::sugerirAlteracao), nos dois lados (web e API).
 */
class SugerirDataRequest extends FormRequest
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
            'data_hora_sugerida' => ['required', 'date', 'after:now'],
        ];
    }
}
