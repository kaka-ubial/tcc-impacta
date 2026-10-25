<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PontuacaoEvento extends Model
{
    public const ENTREGA = 'entrega';

    public const BONUS_INSTITUICAO = 'bonus_instituicao';

    public const BONUS_CAUSA = 'bonus_causa';

    protected $table = 'pontuacao_eventos';

    protected $fillable = ['doador_id', 'doacao_id', 'tipo', 'referencia_id', 'pontos'];

    protected function casts(): array
    {
        return ['pontos' => 'integer'];
    }
}
