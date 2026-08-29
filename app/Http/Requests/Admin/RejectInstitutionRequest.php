<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RejectInstitutionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->tipo_usuario === UserType::Admin;
    }

    public function rules(): array
    {
        return [
            'motivo' => ['required', 'string', 'min:10', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'motivo.required' => 'É obrigatório informar o motivo da rejeição.',
            'motivo.min' => 'O motivo deve ter pelo menos 10 caracteres para ser claro.',
        ];
    }
}
