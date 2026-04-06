<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Necessidade extends Model
{
    use HasFactory;

    protected $table = 'necessidades';

    protected $fillable = ['instituicao_id', 'categoria_id', 'descricao', 'quantidade_objetivo', 'quantidade_atual', 'prioridade'];

    public function instituicao(): BelongsTo
    {
        return $this->belongsTo(Instituicao::class, 'instituicao_id', 'usuario_id');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(CategoriaItem::class, 'categoria_id');
    }
}
