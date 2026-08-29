<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->relationLoaded('doador') && $this->doador
                ? $this->doador->nome_completo
                : ($this->relationLoaded('instituicao') && $this->instituicao ? $this->instituicao->nome_fantasia : null),
            'email' => $this->email,
            'tipo_usuario' => $this->tipo_usuario,
            'status' => $this->status,
            'motivo_suspensao' => $this->motivo_suspensao,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'criado_em' => $this->created_at?->toIso8601String(),
        ];
    }
}
