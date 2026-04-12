<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Doacao extends Model
{
    protected $table = 'doacoes';

    protected $fillable = [
        'doador_id',
        'instituicao_id',
        'status',
    ];

    public function doador(): BelongsTo
    {
        return $this->belongsTo(Doador::class, 'doador_id', 'usuario_id');
    }

    public function instituicao(): BelongsTo
    {
        return $this->belongsTo(Instituicao::class, 'instituicao_id', 'usuario_id');
    }

    public function itens(): HasMany
    {
        return $this->hasMany(ItemDoacao::class, 'doacao_id');
    }

    public function agendamento(): HasOne
    {
        return $this->hasOne(Agendamento::class, 'doacao_id');
    }
}
