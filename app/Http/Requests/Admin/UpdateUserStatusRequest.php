<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserStatus;
use App\Enums\UserType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->tipo_usuario === UserType::Admin;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(UserStatus::class)],
            'motivo' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'É obrigatório informar o novo status.',
            'status.enum' => 'O status deve ser "ativo" ou "suspenso".',
            'motivo.max' => 'O motivo deve ter no máximo 255 caracteres.',
        ];
    }
}
