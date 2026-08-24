<?php

namespace App\Http\Resources;

use App\Models\Transferencia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Espelha o formato do método serialize() de Instituicao\TransferenciaController.
 * A "direção" (enviada/recebida) é calculada em relação à instituição
 * autenticada — carregue as relações `origem` e `destino` na query.
 *
 * @mixin Transferencia
 */
class TransferenciaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $instituicaoId = $request->user()?->instituicao?->usuario_id;
        $direcao = $this->instituicao_origem_id === $instituicaoId ? 'enviada' : 'recebida';
        $parceiro = $direcao === 'enviada' ? $this->destino : $this->origem;

        return [
            'id' => $this->id,
            'status' => $this->status,
            'direcao' => $direcao,
            'criado_em' => $this->created_at->toIso8601String(),
            'data_hora' => $this->data_hora?->toIso8601String(),
            'data_hora_sugerida' => $this->data_hora_sugerida?->toIso8601String(),
            'tipo' => $this->tipo,
            'endereco_referencia' => $this->endereco_referencia,
            'parceiro' => [
                'usuario_id' => $parceiro->usuario_id,
                'nome_fantasia' => $parceiro->nome_fantasia,
            ],
            'itens' => $this->itens->map(fn ($i) => [
                'id' => $i->id,
                'categoria' => $i->categoria->nome,
                'quantidade' => $i->quantidade,
                'descricao' => $i->descricao,
            ]),
        ];
    }
}
