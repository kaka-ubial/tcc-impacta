<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Erro de regra de negócio ao operar sobre uma doação (ex.: instituição sem
 * horários cadastrados, transição de status inválida). Controllers web
 * traduzem para `back()->with('error', ...)`; controllers de API traduzem
 * para uma resposta JSON 422/403.
 */
class DoacaoException extends RuntimeException {}
