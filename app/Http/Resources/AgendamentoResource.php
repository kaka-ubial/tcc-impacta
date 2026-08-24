<?php

namespace App\Http\Resources;

use App\Models\Agendamento;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Espelha o mapping de agendamentos usado por Instituicao\AgendaController::index().
 *
 * @mixin Agendamento
 */
class AgendamentoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'doacao_id' => $this->doacao_id,
            'data_hora' => $this->data_hora->toIso8601String(),
            'data_hora_sugerida' => $this->data_hora_sugerida?->toIso8601String(),
            'tipo' => $this->tipo,
            'status' => $this->status,
            'endereco_referencia' => $this->endereco_referencia,
            'doacao_status' => $this->doacao->status,
            'doador' => [
                'usuario_id' => $this->doacao->doador->usuario_id,
                'nome' => $this->doacao->doador->nome_completo,
                'telefone' => $this->doacao->doador->telefone,
            ],
        ];
    }
}
