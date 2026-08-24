<?php

namespace App\Http\Requests\Instituicao;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação da criação de uma transferência entre instituições. Reaproveitada
 * pelo controller Inertia (Instituicao\TransferenciaController) e pelo de API
 * (Api\Instituicao\TransferenciaController) — a autorização de papel já é feita
 * pelos middlewares na rota.
 */
class StoreTransferenciaRequest extends FormRequest
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
            'instituicao_destino_id' => ['required', 'integer', 'exists:instituicao,usuario_id'],
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.categoria_id' => ['required', 'integer', 'exists:categorias_itens,id'],
            'itens.*.necessidade_id' => ['nullable', 'integer', 'exists:necessidades,id'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1'],
            'itens.*.descricao' => ['nullable', 'string', 'max:255'],
            'agendamento.tipo' => ['required', 'in:coleta,entrega'],
            'agendamento.data_hora' => ['required', 'date', 'after:now'],
            'agendamento.horario_disponivel_id' => ['nullable', 'integer', 'exists:horarios_disponiveis,id'],
            'agendamento.endereco_referencia' => ['nullable', 'string', 'max:500'],
        ];
    }
}
