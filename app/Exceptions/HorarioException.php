<?php

namespace App\Exceptions;

/**
 * Erro de regra de negócio ao operar sobre um horário disponível (ex.:
 * exclusão de horário com doações agendadas em andamento). Em api/* o
 * handler global traduz automaticamente para uma resposta JSON 422 (ver
 * DomainException).
 */
class HorarioException extends DomainException {}
