<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HorarioDisponivel extends Model
{
    protected $table = 'horarios_disponiveis';

    protected $fillable = [
        'instituicao_id',
        'dia_semana',
        'hora_inicio',
        'hora_fim',
        'tipo',
        'ativo',
    ];

    protected function casts(): array
    {
        return [
            'dia_semana' => 'integer',
            'ativo'      => 'boolean',
        ];
    }

    public function instituicao(): BelongsTo
    {
        return $this->belongsTo(Instituicao::class, 'instituicao_id', 'usuario_id');
    }
}
