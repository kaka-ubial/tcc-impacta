<?php

namespace App\Http\Resources;

use App\Models\Avaliacao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Avaliacao
 */
class AvaliacaoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'doacao_id' => $this->doacao_id,
            'nota' => $this->nota,
            'descricao' => $this->descricao,
        ];
    }
}
