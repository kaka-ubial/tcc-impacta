<?php

namespace App\Enums;

/**
 * transferencias.status — ciclo de vida de uma transferência de excedente
 * entre instituições. Nota: "Cancelada" é feminino aqui de propósito
 * (grafia histórica da coluna); DoacaoStatus usa "Cancelado" (masculino) —
 * não normalizar.
 */
enum TransferenciaStatus: string
{
    case Pendente = 'pendente';
    case Confirmada = 'confirmada';
    case Entregue = 'entregue';
    case Recusada = 'recusada';
    case Cancelada = 'cancelada';
    case AlteracaoSugerida = 'alteracao_sugerida';
    case NaoEntregue = 'nao_entregue';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
