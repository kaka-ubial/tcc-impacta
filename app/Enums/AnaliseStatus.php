<?php

namespace App\Enums;

/**
 * analises.status — mesmo vocabulário de InstituicaoStatus (registra o
 * parecer do admin no momento da avaliação), mas é um enum PHP separado
 * porque são colunas/tabelas independentes.
 */
enum AnaliseStatus: string
{
    case Approved = 'approved';
    case Pending = 'pending';
    case Rejected = 'rejected';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
