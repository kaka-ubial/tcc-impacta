<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Substitui CheckDoador/CheckInstituicao/CheckAdmin (corpo idêntico, só o
 * papel mudava). Uso na rota: middleware('user_type:doador').
 */
class EnsureUserType
{
    /**
     * Mensagem de 403 por papel — mantém o texto que cada middleware antigo
     * (CheckDoador, CheckInstituicao, CheckAdmin) já mostrava ao usuário.
     */
    private const MESSAGES = [
        'doador' => 'Acesso negado. Esta área é exclusiva para doadores.',
        'instituicao' => 'Acesso negado. Esta área é exclusiva para instituições.',
        'admin' => 'Acesso negado. Você não tem permissão para acessar esta página.',
    ];

    public function handle(Request $request, Closure $next, string $tipo): Response
    {
        if (auth()->check() && auth()->user()->tipo_usuario?->value === $tipo) {
            return $next($request);
        }

        abort(403, self::MESSAGES[$tipo] ?? 'Acesso negado.');
    }
}
