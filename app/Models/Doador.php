<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['usuario_id', 'nome_completo', 'cpf', 'telefone', 'endereco_completo', 'foto_perfil', 'pontuacao_gamificacao', 'exibir_em_transparencia', 'latitude', 'longitude'])]
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
            'exibir_em_transparencia' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function doacoes(): HasMany
    {
        return $this->hasMany(Doacao::class, 'doador_id', 'usuario_id');
    }

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'doadores_badge', 'doador_id', 'badge_id')
            ->using(DoadorBadge::class)
            ->withPivot('conquistado_em', 'compartilhavel_token');
    }
}
