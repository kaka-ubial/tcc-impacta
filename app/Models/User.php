<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['email', 'password', 'tipo_usuario', 'status'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

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

    public function doador(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Doador::class, 'usuario_id');
    }

    public function instituicao(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Instituicao::class, 'usuario_id');
    }

    public function causas(): BelongsToMany
    {
        return $this->belongsToMany(Causa::class, 'usuario_causa'); 
    }
}
