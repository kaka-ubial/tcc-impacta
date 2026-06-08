<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Avaliacao extends Model
{
    protected $table = 'avaliacoes';

    protected $fillable = [
        'usuario_id',
        'doacao_id',
        'nota',
        'descricao',
    ];

    public function doacao(): BelongsTo
    {
        return $this->belongsTo(Doacao::class, 'doacao_id');
    }

    public function avaliador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
