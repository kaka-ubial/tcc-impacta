<?php

namespace App\Http\Resources;

use App\Models\HorarioDisponivel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
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
        ];
    }
}
