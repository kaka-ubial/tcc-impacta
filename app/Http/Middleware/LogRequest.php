<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Escreve uma linha de log estruturada por requisicao atendida.
 *
 * Sem isto a aplicacao nao emite log nenhum em operacao normal: o
 * AssignRequestId apenas compartilha o contexto, e Log::shareContext nao gera
 * linha — so anexa o request_id a linhas que alguem escreva. Como nenhum ponto
 * do codigo escrevia, o request_id nunca correlacionava nada e nao havia o que
 * enviar ao Loki.
 *
 * Roda depois do AssignRequestId, para que o request_id ja esteja no contexto.
 */
class LogRequest
{
    /**
     * Rotas de infraestrutura ficam de fora: o health check e o endpoint de
     * metricas sao consultados por robo a cada poucos minutos e encheriam o log
     * de ruido sem valor de diagnostico.
     */
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
