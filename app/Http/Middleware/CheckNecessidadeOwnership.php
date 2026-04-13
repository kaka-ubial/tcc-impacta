<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Necessidade; 

class CheckNecessidadeOwnership
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $necessidade = Necessidade::findOrFail($request->id);

        if ($necessidade->instituicao_id !== $request->user()->instituicao->usuario_id) {
            abort(403);
        }
        
        $request->attributes->set('necessidade', $necessidade);

        return $next($request);
    }
}
