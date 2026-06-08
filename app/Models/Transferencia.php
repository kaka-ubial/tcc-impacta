<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transferencia extends Model
{
    protected $table = 'transferencias';

    protected $fillable = [
        'instituicao_origem_id',
        'instituicao_destino_id',
        'status',
        'data_hora',
        'data_hora_sugerida',
        'tipo',
        'endereco_referencia',
        'horario_disponivel_id',
    ];

    protected function casts(): array
    {
        return [
            'data_hora'          => 'datetime',
            'data_hora_sugerida' => 'datetime',
        ];
    }

    public function origem(): BelongsTo
    {
        return $this->belongsTo(Instituicao::class, 'instituicao_origem_id', 'usuario_id');
    }

    public function destino(): BelongsTo
    {
        return $this->belongsTo(Instituicao::class, 'instituicao_destino_id', 'usuario_id');
    }

    public function itens(): HasMany
    {
        return $this->hasMany(ItemTransferencia::class, 'transferencia_id');
    }
}
