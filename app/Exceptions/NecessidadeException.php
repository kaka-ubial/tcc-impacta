<?php

namespace App\Exceptions;

/**
 * Erro de regra de negócio ao operar sobre uma necessidade (ex.: instituição
 * sem horários cadastrados). Controllers web traduzem para um redirect com
 * mensagem de erro; em api/* o handler global traduz automaticamente para
 * uma resposta JSON 422 (ver DomainException).
 */
class NecessidadeException extends DomainException {}
