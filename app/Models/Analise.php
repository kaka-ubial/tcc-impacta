<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Instituicao;
use App\Models\User;

class Analise extends Model
{
    use HasFactory;

    protected $table = 'analises';

    protected $fillable = [
        'instituicao_id', 
        'admin_id', 
        'status', 
        'observacoes'
    ];

    public function instituicao(): BelongsTo
    {
        return $this->belongsTo(Instituicao::class, 'usuario_id');
    }

    public function admin():BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
