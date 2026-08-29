<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Prometheus\CollectorRegistry;

class CollectMetrics
{
    public function __construct(private readonly CollectorRegistry $registry) {}

    public function handle(Request $request, Closure $next)
    {
        $start = microtime(true);

        $response = $next($request);

        $route = $request->route()?->uri() ?? 'unknown';
        $labels = [$request->method(), $route, (string) $response->getStatusCode()];

        $this->registry->getOrRegisterCounter(
            'impacta', 'http_requests_total',
            'Total number of HTTP requests',
            ['method', 'route', 'status']
        )->inc($labels);

        $this->registry->getOrRegisterHistogram(
            'impacta', 'http_request_duration_seconds',
            'Duration of HTTP requests in seconds',
            ['method', 'route', 'status'],
            [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
        )->observe(microtime(true) - $start, $labels);

        return $response;
    }
}