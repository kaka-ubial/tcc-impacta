<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\LogRecord;

/**
 * Enriquece toda linha de log com contexto de quem originou a requisicao.
 *
 * Roda como processor do Monolog, e nao no middleware, porque o processor e
 * executado no momento em que a linha e escrita — ai a autenticacao ja foi
 * resolvida. No middleware global o auth() ainda seria nulo.
 *
 * Atencao ao tipo do parametro: um "tap" recebe o Illuminate\Log\Logger, nao
 * o Monolog\Logger. Tipar errado faz o canal falhar em silencio — o Laravel
 * captura a excecao e cai no logger de emergencia, gravando em arquivo.
 */
class AddRequestContext
{
    public function __invoke(Logger $logger): void
    {
        $logger->getLogger()->pushProcessor(function (LogRecord $record): LogRecord {
            return $record->with(extra: [
                ...$record->extra,
                'env' => app()->environment(),
                // hasUser() nao dispara a resolucao do guard: em comandos de
                // console e jobs de fila nao existe usuario, e tentar resolver
                // levantaria excecao.
                'user_id' => auth()->hasUser() ? auth()->id() : null,
            ]);
        });
    }
}
