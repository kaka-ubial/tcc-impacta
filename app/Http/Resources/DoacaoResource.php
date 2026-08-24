<?php

namespace App\Http\Resources;

use App\Models\Doacao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Doacao
 */
class DoacaoResource extends JsonResource
{
    /**
     * Espelha o formato já usado por Doador\DoacaoController::index() para
     * a página Inertia, garantindo que web e API exponham o mesmo shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'instituicao' => [
                'id' => $this->instituicao->usuario_id,
                'nome_fantasia' => $this->instituicao->nome_fantasia,
            ],
            'itens' => $this->itens->map(fn ($item) => [
                'id' => $item->id,
                'categoria' => $item->categoria->nome,
                'quantidade' => $item->quantidade,
                'descricao' => $item->descricao,
            ]),
            'agendamento' => $this->agendamento ? [
                'data_hora' => $this->agendamento->data_hora->toIso8601String(),
                'tipo' => $this->agendamento->tipo,
                'endereco_referencia' => $this->agendamento->endereco_referencia,
                'status' => $this->agendamento->status,
                'data_hora_sugerida' => $this->agendamento->data_hora_sugerida?->toIso8601String(),
            ] : null,
            'criado_em' => $this->created_at->toIso8601String(),
            'avaliacao' => $this->whenLoaded('avaliacao', fn () => $this->avaliacao ? [
                'nota' => $this->avaliacao->nota,
                'descricao' => $this->avaliacao->descricao,
            ] : null),
        ];
    }
}
