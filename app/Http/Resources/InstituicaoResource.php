<?php

namespace App\Http\Resources;

use App\Models\Instituicao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Instituicao
 */
class InstituicaoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->usuario_id,
            'nome_fantasia' => $this->nome_fantasia,
            'razao_social' => $this->razao_social,
            'cnpj' => $this->cnpj,
            'status' => $this->status,
            'endereco_completo' => $this->endereco_completo,
        ];
    }
}
