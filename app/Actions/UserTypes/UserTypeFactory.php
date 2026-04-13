<?php

namespace App\Actions\UserTypes;

use App\Actions\UserTypes\Handlers\DoadorHandler;
use App\Actions\UserTypes\Handlers\InstituicaoHandler;
use App\Actions\UserTypes\Contracts\UserTypeHandler;

class UserTypeFactory {
    public static function make(string $tipo): UserTypeHandler
    {
        return match ($tipo){
            'doador' => new DoadorHandler(),
            'instituicao' => new InstituicaoHandler(),
            default => throw new \Exception("Tipo de usuário inválido: {$tipo}"),
        };
    }
}