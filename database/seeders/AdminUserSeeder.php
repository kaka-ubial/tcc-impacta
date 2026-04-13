<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'email' => 'admin@impacta.com',
            'password' => Hash::make('senha_segura'),
            'tipo_usuario' => 'admin',
            'status' => 'ativo',
        ]);
    }
}
