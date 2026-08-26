<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Symfony\Component\HttpFoundation\Response;

/**
 * Derruba, a cada requisição autenticada, uma conta que foi suspensa depois
 * do login (usuarios.status = 'suspenso'). Login novo já é bloqueado por
 * ResolveAuthenticatedUser; esta middleware cobre sessão web e token Sanctum
 * que já estavam ativos no momento da suspensão.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        if (! $user || $user->status !== UserStatus::Suspenso) {
            return $next($request);
        }

        if ($request->is('api/*') || $request->expectsJson()) {
            $request->user()?->currentAccessToken()?->delete();

            abort(403, 'Sua conta foi suspensa. Entre em contato com o suporte.');
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::route('login')->with('status', 'Sua conta foi suspensa. Entre em contato com o suporte.');
    }
}
