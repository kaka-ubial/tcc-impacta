<?php

namespace App\Enums;

/**
 * Eixo "conta pode logar/operar?" de usuarios.status. Ortogonal a
 * InstituicaoStatus (que trata da validação do cadastro da instituição) —
 * ver context/features/rf17-gestao-usuarios.md.
 */
enum UserStatus: string
{
    case Ativo = 'ativo';
    case Suspenso = 'suspenso';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
