<?php

namespace App\Actions\UserTypes\Contracts;

use App\Models\User;

interface UserTypeHandler
{
    public function create(User $user, array $data): void;
    public function update(User $user, array $data): void;
}