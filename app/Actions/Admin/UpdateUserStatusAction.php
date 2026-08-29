<?php

namespace App\Actions\Admin;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;


class UpdateUserStatusAction
{
    public function execute(User $user, UserStatus $status, ?string $motivo): void
    {
        DB::transaction(function () use ($user, $status, $motivo) {
            $user->update([
                'status' => $status,
                'motivo_suspensao' => $status === UserStatus::Suspenso ? $motivo : null,
            ]);

            if ($status === UserStatus::Suspenso) {
                $user->tokens()->delete();
            }
        });
    }
}
