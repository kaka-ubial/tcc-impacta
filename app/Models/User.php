<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['email', 'password', 'tipo_usuario', 'status', 'motivo_suspensao'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $table = 'usuarios';

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function doador(): HasOne
    {
        return $this->hasOne(Doador::class, 'usuario_id');
    }

    public function instituicao(): HasOne
    {
        return $this->hasOne(Instituicao::class, 'usuario_id');
    }

    public function causas(): BelongsToMany
    {
        return $this->belongsToMany(Causa::class, 'usuario_causa');
    }

    public function instituicaoId(): ?int
    {
        return $this->instituicao?->usuario_id;
    }

    public function doadorId(): ?int
    {
        return $this->doador?->usuario_id;
    }
}
