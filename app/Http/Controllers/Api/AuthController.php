<?php

namespace App\Http\Controllers\Api;

use App\Actions\Auth\ResolveAuthenticatedUser;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Laravel\Fortify\Fortify;

/**
 * Autenticação stateless (token) para a API. Complementa o login por sessão
 * do Fortify (usado pela UI Inertia) sem substituí-lo — ambos reaproveitam
 * a mesma lógica de resolução de credenciais e de criação de usuário.
 */
class AuthController extends Controller
{
    public function login(Request $request, ResolveAuthenticatedUser $resolver)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ]);

        $throttleKey = Str::transliterate(Str::lower($request->email).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            throw ValidationException::withMessages([
                'email' => ['Muitas tentativas. Tente novamente em breve.'],
            ]);
        }

        $user = $resolver->resolve($request->email, $request->password);

        if (! $user) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                Fortify::username() => ['As credenciais informadas não conferem.'],
            ]);
        }

        RateLimiter::clear($throttleKey);

        $token = $user->createToken($request->input('device_name', 'api'));

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => new UserResource($user),
        ], 201);
    }

    public function register(Request $request, CreatesNewUsers $creator)
    {
        $user = $creator->create($request->all());

        $token = $user->createToken($request->input('device_name', 'api'));

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => new UserResource($user),
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    public function me(Request $request)
    {
        return new UserResource($request->user());
    }
}
