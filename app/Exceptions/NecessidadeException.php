<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Erro de regra de negócio ao operar sobre uma necessidade (ex.: instituição
 * sem horários cadastrados). Controllers web traduzem para um redirect com
 * mensagem de erro; controllers de API traduzem para uma resposta JSON 422.
 */
class NecessidadeException extends RuntimeException {}
