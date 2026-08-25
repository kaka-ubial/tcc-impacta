<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->tipo_usuario === 'admin';
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:ativo,suspenso'],
            'motivo' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'É obrigatório informar o novo status.',
            'status.in' => 'O status deve ser "ativo" ou "suspenso".',
            'motivo.max' => 'O motivo deve ter no máximo 255 caracteres.',
        ];
    }
}
