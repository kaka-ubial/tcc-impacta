<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Closure;

class CheckAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if(auth()->check() && auth()->user()->tipo_usuario === 'admin') {
            return $next($request);
        }
        abort(403, 'Acesso negado. Você não tem permissão para acessar esta página.');
    }
}
