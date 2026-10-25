<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class DoadorBadge extends Pivot
{
    protected $table = 'doadores_badge';

    public $incrementing = true;

    protected $fillable = ['doador_id', 'badge_id', 'conquistado_em', 'compartilhavel_token'];

    protected function casts(): array
    {
        return ['conquistado_em' => 'datetime'];
    }

    public function badge(): BelongsTo
    {
        return $this->belongsTo(Badge::class);
    }

    public function doador(): BelongsTo
    {
        return $this->belongsTo(Doador::class, 'doador_id', 'usuario_id');
    }
}
