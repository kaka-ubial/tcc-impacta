<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['usuario_id', 'nome_fantasia', 'razao_social', 'cnpj', 'telefone', 'endereco_completo', 'latitude', 'longitude', 'validada_por_admin'])]
class Instituicao extends Model
{
    use HasFactory;

    protected $table = 'instituicao';
    protected $primaryKey = 'usuario_id';
    public $incrementing = false;

    protected function casts(): array
    {
        return [
            'validada_por_admin' => 'boolean',
            'latitude'           => 'float',
            'longitude'          => 'float',
        ];
    }


    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

}
