<?php

namespace App\Http\Requests\Admin;

use App\Rules\Cpf;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDoadorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->tipo_usuario === 'admin';
    }

    public function rules(): array
    {
        $doadorId = $this->route('user')?->id;

        return [
            'nome_completo' => ['required', 'string', 'min:2', 'max:255'],
            'cpf' => ['required', 'string', new Cpf, Rule::unique('doador', 'cpf')->ignore($doadorId, 'usuario_id')],
            'telefone' => ['required', 'string', 'regex:/^\(\d{2}\)\s\d{4,5}-\d{4}$/'],
            'endereco_completo' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome_completo.required' => 'O nome é obrigatório.',
            'cpf.required' => 'O CPF é obrigatório.',
            'cpf.unique' => 'Este CPF já está em uso por outro doador.',
            'telefone.regex' => 'Telefone inválido. Use o formato (99) 99999-9999.',
        ];
    }
}
