<?php

namespace App\Enums;

/**
 * agendamentos.status — estado da data/horário combinado para uma doação.
 * Default de banco é "Confirmado". Independente de DoacaoStatus (uma doação
 * pode estar confirmada com o agendamento ainda em alteracao_sugerida).
 */
enum AgendamentoStatus: string
{
    case Confirmado = 'confirmado';
    case Pendente = 'pendente';
    case AlteracaoSugerida = 'alteracao_sugerida';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
