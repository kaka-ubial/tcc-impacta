<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogRequest
{
    private const IGNORAR = ['up', 'metrics'];

    public function handle(Request $request, Closure $next): Response
    {
        $inicio = microtime(true);

        $response = $next($request);

        if (! $request->is(self::IGNORAR)) {
            Log::info('http_request', [
                'metodo' => $request->method(),
                'rota' => '/'.ltrim($request->path(), '/'),
                'status' => $response->getStatusCode(),
                'duracao_ms' => round((microtime(true) - $inicio) * 1000, 1),
                'ip' => $request->ip(),
            ]);
        }

        return $response;
    }
}
