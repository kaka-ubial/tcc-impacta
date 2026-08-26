<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserType;
use App\Rules\Cnpj;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInstituicaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->tipo_usuario === UserType::Admin;
    }

    public function rules(): array
    {
        $instituicaoId = $this->route('user')?->id;

        return [
            'nome_fantasia' => ['required', 'string', 'min:2', 'max:255'],
            'razao_social' => ['required', 'string', 'min:2', 'max:255'],
            'cnpj' => ['required', 'string', new Cnpj, Rule::unique('instituicao', 'cnpj')->ignore($instituicaoId, 'usuario_id')],
            'telefone' => ['required', 'string', 'regex:/^\(\d{2}\)\s\d{4,5}-\d{4}$/'],
            'endereco_completo' => ['required', 'string', 'min:10', 'max:500'],
            'descricao' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome_fantasia.required' => 'O nome fantasia é obrigatório.',
            'razao_social.required' => 'A razão social é obrigatória.',
            'cnpj.required' => 'O CNPJ é obrigatório.',
            'cnpj.unique' => 'Este CNPJ já está em uso por outra instituição.',
            'telefone.regex' => 'Telefone inválido. Use o formato (99) 99999-9999.',
            'endereco_completo.required' => 'O endereço é obrigatório.',
        ];
    }
}
