<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['usuario_id','nome_completo', 'cpf','telefone','pontuacao_gamificacao','latitude','longitude'])]
class Doador extends Model
{

    use HasFactory;

    protected $table = 'doador';
    protected $primaryKey = 'usuario_id';
    public $incrementing = false;

    protected function casts(): array
    {
        return [
            'pontuacao_gamificacao' => 'integer',
            'latitude'              => 'float',
            'longitude'             => 'float',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }


}
