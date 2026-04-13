<?php

namespace Database\Seeders;

use App\Models\Causa;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CausaSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $causas = [
                ['nome' => 'Proteção Animal', 'icone' => 'paw'],
                ['nome' => 'Educação', 'icone' => 'graduation-cap'],
                ['nome' => 'Meio Ambiente', 'icone' => 'leaf'],
                ['nome' => 'Saúde', 'icone' => 'heartbeat'],
                ['nome' => 'Combate à Fome', 'icone' => 'utensils'],
            ];

        foreach ($causas as $causa) {
            Causa::create($causa);
        }
    }
}
