<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacao extends Model
{
    protected $table = 'notificacoes';

    protected $fillable = [
        'usuario_id',
        'titulo',
        'mensagem',
        'lida',
    ];

    protected function casts(): array
    {
        return [
            'lida' => 'boolean',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public static function enviar(int $usuarioId, string $titulo, string $mensagem): void
    {
        static::create([
            'usuario_id' => $usuarioId,
            'titulo'     => $titulo,
            'mensagem'   => $mensagem,
        ]);
    }
}
