<?php

namespace App\Http\Resources;

use App\Models\Doacao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Espelha o formato visto pela instituição em Instituicao\DoacaoController
 * (doador aninhado, em vez de instituicao) — contraparte de DoacaoResource,
 * que espelha a visão do doador.
 *
 * @mixin Doacao
 */
class InstituicaoDoacaoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'doador' => [
                'usuario_id' => $this->doador->usuario_id,
                'nome' => $this->doador->nome_completo,
                'telefone' => $this->doador->telefone,
                'foto_perfil' => $this->doador->foto_perfil,
            ],
            'itens' => $this->itens->map(fn ($item) => [
                'id' => $item->id,
                'categoria' => $item->categoria->nome,
                'quantidade' => $item->quantidade,
                'descricao' => $item->descricao,
            ]),
            'agendamento' => $this->agendamento ? [
                'id' => $this->agendamento->id,
                'data_hora' => $this->agendamento->data_hora->toIso8601String(),
                'tipo' => $this->agendamento->tipo,
                'status' => $this->agendamento->status,
                'data_hora_sugerida' => $this->agendamento->data_hora_sugerida?->toIso8601String(),
                'endereco_referencia' => $this->agendamento->endereco_referencia,
            ] : null,
            'criado_em' => $this->created_at->toIso8601String(),
            'avaliacao' => $this->whenLoaded('avaliacao', fn () => $this->avaliacao ? [
                'nota' => $this->avaliacao->nota,
                'descricao' => $this->avaliacao->descricao,
            ] : null),
        ];
    }
}
