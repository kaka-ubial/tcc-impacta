<?php

namespace App\Http\Resources;

use App\Models\HorarioDisponivel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Espelha o formato usado por Instituicao\HorarioController::index() (web) e
 * pela API. 'pode_excluir' só aparece quando a query anota o virtual
 * attribute 'tem_doacoes_ativas' via withExists() — nas demais telas
 * (agenda, doações, transferências) essa checagem não é necessária e o
 * campo é omitido.
 *
 * @mixin HorarioDisponivel
 */
class HorarioResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dia_semana' => $this->dia_semana,
            'hora_inicio' => $this->hora_inicio,
            'hora_fim' => $this->hora_fim,
            'tipo' => $this->tipo,
            'ativo' => $this->ativo,
            'pode_excluir' => $this->when(! is_null($this->tem_doacoes_ativas), fn () => ! $this->tem_doacoes_ativas),
        ];
    }
}
