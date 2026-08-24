<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Base das exceptions de regra de negócio (DoacaoException, HorarioException,
 * NecessidadeException, TransferenciaException). Em api/* o handler global
 * (bootstrap/app.php) traduz qualquer instância desta classe para uma resposta
 * JSON 422 automaticamente — os controllers de API não precisam de try/catch.
 * Controllers web continuam capturando a exception concreta e devolvendo
 * back()->with('error', ...), sem mudança de comportamento.
 */
abstract class DomainException extends RuntimeException {}
