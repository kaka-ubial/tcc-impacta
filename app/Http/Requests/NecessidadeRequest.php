<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class NecessidadeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->user()->instituicao !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'categoria_id' => 'required|exists:categorias_itens,id',
            'descricao' => 'required|string|max:255',
            'quantidade_objetivo' => 'required|integer|min:1',
            'prioridade' => 'required|in:baixa,media,alta',        
        ];
    }
}
