<?php

namespace App\Exceptions;

/**
 * Erro de regra de negócio ao operar sobre uma transferência entre
 * instituições (ex.: autotransferência, quantidade acima do estoque
 * disponível). Controllers web traduzem para um abort/redirect; em api/*
 * o handler global traduz automaticamente para uma resposta JSON 422 (ver
 * DomainException).
 */
class TransferenciaException extends DomainException {}
