<?php

namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyMetricsToken
{
    public function handle(Request $request, Closure $next): Response
    {        
        $expected = config('services.metrics.token');

        abort_if(blank($expected), 404);
        abort_unless(
            hash_equals($expected, (string) $request->bearerToken()),
            401
        );

        return $next($request);
        }
    }
