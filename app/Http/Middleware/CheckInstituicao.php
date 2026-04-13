<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckInstituicao
{
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check() && auth()->user()->tipo_usuario === 'instituicao') {
            return $next($request);
        }
        abort(403, 'Acesso negado. Esta área é exclusiva para instituições.');
    }
}
