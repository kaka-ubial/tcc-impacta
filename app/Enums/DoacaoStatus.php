<?php

namespace App\Enums;

/**
 * doacoes.status — ciclo de vida de uma solicitação de doação.
 * Nota: "Cancelado" é masculino aqui de propósito (grafia histórica da
 * coluna); TransferenciaStatus usa "Cancelada" (feminino) — não normalizar.
 */
enum DoacaoStatus: string
{
    case Pendente = 'pendente';
    case Confirmada = 'confirmada';
    case Entregue = 'entregue';
    case Cancelado = 'cancelado';
    case Recusada = 'recusada';
    case NaoEntregue = 'nao_entregue';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
