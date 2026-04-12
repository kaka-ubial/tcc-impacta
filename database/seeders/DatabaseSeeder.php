<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Instituicao;
use App\Models\CategoriaItem;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory(10)
            ->create([
                'tipo_usuario' => 'instituicao',
                'status' => 'ativo',
            ])
            ->each(function ($user) {
                $user->instituicao()->create(
                    Instituicao::factory()->make()->toArray()
                );
            });
        $this->call(CategoriaItemSeeder::class);
    }
}
