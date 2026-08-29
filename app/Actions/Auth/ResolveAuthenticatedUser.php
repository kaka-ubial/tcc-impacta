<?php

namespace App\Actions\Auth;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Fortify;

class ResolveAuthenticatedUser
{
    /**
     * Resolve the user matching the given credentials.
     *
     * Shared by Fortify (session login) and the API auth controller (token
     * login) so both entry points enforce the same rules — including the
     * suspended-account check.
     *
     * @return User|null the matching user, or null if the credentials don't match
     *
     * @throws ValidationException if the account is suspended
     */
    public function resolve(string $email, string $password): ?User
    {
        $user = User::where(Fortify::username(), $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return null;
        }

        if ($user->status === UserStatus::Suspenso) {
            throw ValidationException::withMessages([
                Fortify::username() => ['Sua conta foi suspensa. Entre em contato com o suporte.'],
            ]);
        }

        return $user;
    }
}
