<?php

namespace App\Services;

use App\Models\User;

class UserRedirectService {
    public function getRedirectRoute(User $user): string
    {
        if ($user->tipo_usuario === 'instituicao') {
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

        if ($user->tipo_usuario === 'admin') {
            return route('admin.institutions.index');
        }

        return route('instituicoes.index');
    }
}