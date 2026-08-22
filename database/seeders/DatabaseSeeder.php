<?php

namespace Database\Seeders;

use App\Models\Instituicao;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! Instituicao::exists()) {
            User::factory(10)
                ->create([
                    'tipo_usuario' => 'instituicao',
                    'status'       => 'ativo',
                ])
                ->each(function ($user) {
                    $user->instituicao()->create(
                        Instituicao::factory()->make()->toArray()
                    );
                });
        }

        $this->call(CategoriaItemSeeder::class);
        $this->call(AdminUserSeeder::class);
        $this->call(CausaSeeder::class);
        $this->call(InstituicaoSeeder::class);
        $this->call(HorarioDisponivelSeeder::class);
        $this->call(NecessidadeSeeder::class);
        $this->call(BadgeSeeder::class);
        $this->call(AnaliseSeeder::class);
        $this->call(DoadorSeeder::class);
        $this->call(DoacaoSeeder::class);
        $this->call(TransferenciaSeeder::class);
    }
}
