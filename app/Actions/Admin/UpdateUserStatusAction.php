<?php

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\DB;


class UpdateUserStatusAction
{
    public function execute(User $user, string $status, ?string $motivo): void
    {
        DB::transaction(function () use ($user, $status, $motivo) {
            $user->update([
                'status' => $status,
                'motivo_suspensao' => $status === 'suspenso' ? $motivo : null,
            ]);

            if ($status === 'suspenso') {
                $user->tokens()->delete();
            }
        });
    }
}
