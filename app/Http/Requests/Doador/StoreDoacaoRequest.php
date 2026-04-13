<?php

namespace App\Http\Requests\Doador;

use Illuminate\Foundation\Http\FormRequest;

class StoreDoacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'instituicao_id'                    => ['required', 'integer', 'exists:instituicao,usuario_id'],
            'itens'                             => ['required', 'array', 'min:1'],
            'itens.*.necessidade_id'            => ['nullable', 'integer', 'exists:necessidades,id'],
            'itens.*.categoria_id'              => ['required', 'integer', 'exists:categorias_itens,id'],
            'itens.*.quantidade'                => ['required', 'integer', 'min:1'],
            'itens.*.descricao'                 => ['nullable', 'string', 'max:255'],
            'agendamento.tipo'                  => ['required', 'in:coleta,entrega'],
            'agendamento.data_hora'             => ['required', 'date', 'after:now'],
            'agendamento.endereco_referencia'   => ['nullable', 'string', 'max:255', 'required_if:agendamento.tipo,coleta'],
        ];
    }

    public function messages(): array
    {
        return [
            'instituicao_id.exists'                    => 'Instituição não encontrada.',
            'itens.required'                           => 'Adicione ao menos um item.',
            'itens.*.categoria_id.required'            => 'Selecione a categoria do item.',
            'itens.*.quantidade.min'                   => 'A quantidade deve ser ao menos 1.',
            'agendamento.tipo.required'                => 'Selecione o tipo de entrega.',
            'agendamento.data_hora.required'           => 'Selecione a data e horário.',
            'agendamento.data_hora.after'              => 'A data deve ser futura.',
            'agendamento.endereco_referencia.required_if' => 'Informe o endereço para coleta.',
        ];
    }
}
