<?php

namespace App\Services;

use App\Models\User;

class UserRedirectService {
    public function getRedirectRoute(User $user): string
    {
        if ($user->tipo_usuario === 'instituicao' && $user->instituicao) {
            $user->load('instituicao');
            $status = $user->instituicao->status;

            return match ($status) {
                'pending'=> route('waiting-validation'),
                'rejected'=> route('profile.edit'),
                'approved' => route('dashboard'),
                default => route('dashboard'),
            };
        }
        return route('dashboard');
    }
}