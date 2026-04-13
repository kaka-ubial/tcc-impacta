<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['usuario_id', 'nome_fantasia', 'razao_social', 'cnpj', 'telefone', 'endereco_completo', 'descricao', 'latitude', 'longitude', 'status'])]
class Instituicao extends Model
{
    use HasFactory;

    protected $table = 'instituicao';
    protected $primaryKey = 'usuario_id';
    public $incrementing = false;

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'latitude'           => 'float',
            'longitude'          => 'float',
        ];
    }


    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function analises(): HasMany
    {
        return $this->hasMany(Analise::class, 'instituicao_id', 'usuario_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function scopeVisible(Builder $query): void
    {
        $query->whereIn('status', ['pending', 'approved']);
    }


    public function causas(): BelongsToMany
    {
        return $this->belongsToMany(Causa::class, 'usuario_causa', 'user_id', 'causa_id', 'usuario_id');
    }

    public function necessidades(): HasMany
    {
        return $this->hasMany(Necessidade::class, 'instituicao_id', 'usuario_id');
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(HorarioDisponivel::class, 'instituicao_id', 'usuario_id');
    }

}
