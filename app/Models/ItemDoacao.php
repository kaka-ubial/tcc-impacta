<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemDoacao extends Model
{
    protected $table = 'itens_doacao';

    protected $fillable = [
        'doacao_id',
        'necessidade_id',
        'categoria_id',
        'descricao',
        'quantidade',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'integer',
        ];
    }

    public function doacao(): BelongsTo
    {
        return $this->belongsTo(Doacao::class, 'doacao_id');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(CategoriaItem::class, 'categoria_id');
    }

    public function necessidade(): BelongsTo
    {
        return $this->belongsTo(Necessidade::class, 'necessidade_id');
    }
}
