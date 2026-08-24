<?php

namespace App\Exceptions;

/**
 * Erro de regra de negócio ao operar sobre uma doação (ex.: instituição sem
 * horários cadastrados, transição de status inválida). Controllers web
 * traduzem para `back()->with('error', ...)`; em api/* o handler global
 * traduz automaticamente para uma resposta JSON 422 (ver DomainException).
 */
class DoacaoException extends DomainException {}
