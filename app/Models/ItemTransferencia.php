<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemTransferencia extends Model
{
    protected $table = 'itens_transferencia';

    protected $fillable = [
        'transferencia_id',
        'categoria_id',
        'necessidade_id',
        'quantidade',
        'descricao',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'integer',
        ];
    }

    public function transferencia(): BelongsTo
    {
        return $this->belongsTo(Transferencia::class, 'transferencia_id');
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
