<?php

namespace App\Services;

use App\Models\User;

class UserRedirectService {
    public function getRedirectRoute(User $user): string
    {
        if ($user->tipo_usuario === 'instituicao' && $user->instituicao) {
            $instituicao = $user->instituicao;

            return match (true) {
                $instituicao->isPending()  => route('waiting-validation'),
                $instituicao->isRejected() => route('rejected'),
                $instituicao->isApproved() => route('instituicao.painel'),
                default                    => route('instituicao.painel'),
            };
        }
        return route('instituicoes.index');
    }
}