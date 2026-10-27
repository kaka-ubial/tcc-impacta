<?php

namespace App\Http\Requests\Instituicao;

use App\Services\EstatisticasInstituicaoService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Layout personalizado da tela de estatísticas: ordem e visibilidade dos
 * widgets e o período padrão.
 */
class SalvarLayoutEstatisticasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'widgets' => ['required', 'array', 'max:'.count(EstatisticasInstituicaoService::WIDGETS)],
            'widgets.*.id' => ['required', 'string', 'distinct', Rule::in(EstatisticasInstituicaoService::WIDGETS)],
            'widgets.*.visivel' => ['required', 'boolean'],
            'periodo' => ['required', Rule::in(EstatisticasInstituicaoService::PERIODOS)],
        ];
    }
}
