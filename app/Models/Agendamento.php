<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Agendamento extends Model
{
    protected $table = 'agendamentos';

    protected $fillable = [
        'doacao_id',
        'data_hora',
        'tipo',
        'endereco_referencia',
    ];

    protected function casts(): array
    {
        return [
            'data_hora' => 'datetime',
        ];
    }

    public function doacao(): BelongsTo
    {
        return $this->belongsTo(Doacao::class, 'doacao_id');
    }
}
