<?php

namespace App\Http\Resources;

use App\Models\Necessidade;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Necessidade
 */
class NecessidadeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'categoria' => [
                'id' => $this->categoria->id,
                'nome' => $this->categoria->nome,
            ],
            'descricao' => $this->descricao,
            'quantidade_objetivo' => $this->quantidade_objetivo,
            'quantidade_atual' => $this->quantidade_atual,
            'prioridade' => $this->prioridade,
            'instituicao' => $this->whenLoaded('instituicao', fn () => [
                'id' => $this->instituicao->usuario_id,
                'nome_fantasia' => $this->instituicao->nome_fantasia,
            ]),
        ];
    }
}
