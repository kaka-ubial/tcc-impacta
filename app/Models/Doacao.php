<?php

namespace App\Models;

use App\Enums\DoacaoStatus;
use Illuminate\Database\Eloquent\Builder;
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
        'data_entrega',
    ];

    protected function casts(): array
    {
        return [
            'data_entrega' => 'datetime',
            'status' => DoacaoStatus::class,
        ];
    }

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

    public function avaliacao(): HasOne
    {
        return $this->hasOne(Avaliacao::class, 'doacao_id');
    }

    /**
     * Apenas doações entregues podem aparecer no portal público de transparência
     */
    public function scopePublicas(Builder $query): Builder
    {
        return $query->where('status', DoacaoStatus::Entregue);
    }
}
