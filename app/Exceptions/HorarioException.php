<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Erro de regra de negócio ao operar sobre um horário disponível (ex.:
 * exclusão de horário com doações agendadas em andamento).
 */
class HorarioException extends RuntimeException {}
