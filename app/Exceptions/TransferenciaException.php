<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Erro de regra de negócio ao operar sobre uma transferência entre
 * instituições (ex.: autotransferência, quantidade acima do estoque
 * disponível). Controllers web traduzem para um abort/redirect;
 * controllers de API traduzem para uma resposta JSON 422.
 */
class TransferenciaException extends RuntimeException {}
