<?php

namespace App\Enums;

/**
 * Eixo "cadastro da instituição foi validado?" de instituicao.status.
 * Ortogonal a UserStatus — ver context/features/rf17-gestao-usuarios.md.
 */
enum InstituicaoStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
