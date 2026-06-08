<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Agendamento extends Model
{
    protected $table = 'agendamentos';

    protected $fillable = [
        'doacao_id',
        'horario_disponivel_id',
        'data_hora',
        'tipo',
        'endereco_referencia',
        'status',
        'data_hora_sugerida',
    ];

    protected function casts(): array
    {
        return [
            'data_hora'          => 'datetime',
            'data_hora_sugerida' => 'datetime',
        ];
    }

    public function doacao(): BelongsTo
    {
        return $this->belongsTo(Doacao::class, 'doacao_id');
    }

    public function horarioDisponivel(): BelongsTo
    {
        return $this->belongsTo(HorarioDisponivel::class, 'horario_disponivel_id');
    }
}
