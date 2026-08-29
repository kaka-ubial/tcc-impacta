<?php

namespace App\Services;

use App\Enums\UserType;
use App\Models\User;

class UserRedirectService {
    public function getRedirectRoute(User $user): string
    {
        if ($user->tipo_usuario === UserType::Instituicao) {
            $instituicao = $user->instituicao;

            if (! $instituicao) {
                return route('waiting-validation');
            }

            return match (true) {
                $instituicao->isPending()  => route('waiting-validation'),
                $instituicao->isRejected() => route('rejected'),
                $instituicao->isApproved() => route('instituicao.painel'),
                default                    => route('waiting-validation'),
            };
        }

        if ($user->tipo_usuario === UserType::Admin) {
            return route('admin.institutions.index');
        }

        return route('instituicoes.index');
    }
}