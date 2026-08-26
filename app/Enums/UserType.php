<?php

namespace App\Enums;

/**
 * usuarios.tipo_usuario — o papel da conta. Ordem dos cases preserva a
 * ordem usada hoje em tipo_options no painel admin (doador, instituicao,
 * admin).
 */
enum UserType: string
{
    case Doador = 'doador';
    case Instituicao = 'instituicao';
    case Admin = 'admin';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
