<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    protected $table = 'badges';

    protected $fillable = ['codigo', 'nome', 'descricao', 'imagem_url', 'requisito_pontos', 'regra', 'limiar'];

    protected function casts(): array
    {
        return [
            'requisito_pontos' => 'integer',
            'limiar' => 'integer',
        ];
    }
}
