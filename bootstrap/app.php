<?php

use App\Http\Controllers\MetricsController;
use App\Exceptions\DomainException;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\EnsureUserType;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\VerifyMetricsToken;
use App\Http\Middleware\CollectMetrics;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('metrics.token')->get('/metrics', MetricsController::class);
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->alias([
            'user_type' => EnsureUserType::class,
            'active' => EnsureUserIsActive::class,
            'metrics.token' => VerifyMetricsToken::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsureUserIsActive::class,
            CollectMetrics::class,
        ]);

        $middleware->api(append: [
            CollectMetrics::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Qualquer exception de regra de negócio (DoacaoException,
        // HorarioException, NecessidadeException, TransferenciaException) que
        // "escapar" de um controller de API vira automaticamente um JSON 422
        // — os controllers de API não precisam mais de try/catch para isso.
        // Retornar null (requisição web) deixa o Laravel seguir para o
        // tratamento padrão; os controllers web continuam com seu próprio
        // catch, então nem chegam a passar por aqui.
        $exceptions->render(function (DomainException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        });

        // Requisições para a API (ou que explicitamente aceitam JSON) sempre
        // recebem erros em JSON, nunca a página de erro Inertia.
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $exception) {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return $response;
            }

            if (in_array($response->getStatusCode(), [403, 404, 419, 500, 503])) {
                return Inertia::render('error', ['status' => $response->getStatusCode()])
                    ->toResponse($request)
                    ->setStatusCode($response->getStatusCode());
            }

            return $response;
        });
    })->create();
