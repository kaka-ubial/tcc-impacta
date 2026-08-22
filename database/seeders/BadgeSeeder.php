<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * A tabela `badges` ainda não tem model (a gamificação é a RF20), então o
 * catálogo é inserido direto pelo query builder.
 */
class BadgeSeeder extends Seeder
{
    private const BADGES = [
        ['nome' => 'Primeira Doação', 'descricao' => 'Concluiu a primeira doação na plataforma.', 'requisito_pontos' => 0],
        ['nome' => 'Doador Constante', 'descricao' => 'Realizou cinco doações entregues.', 'requisito_pontos' => 100],
        ['nome' => 'Parceiro das Causas', 'descricao' => 'Apoiou três causas diferentes.', 'requisito_pontos' => 250],
        ['nome' => 'Impacto Local', 'descricao' => 'Doou para cinco instituições distintas.', 'requisito_pontos' => 400],
        ['nome' => 'Referência Solidária', 'descricao' => 'Alcançou 700 pontos de gamificação.', 'requisito_pontos' => 700],
    ];

    public function run(): void
    {
        foreach (self::BADGES as $badge) {
            DB::table('badges')->updateOrInsert(
                ['nome' => $badge['nome']],
                $badge + ['imagem_url' => null, 'created_at' => now(), 'updated_at' => now()],
            );
        }

        $this->command?->info('Badges: '.DB::table('badges')->count().' no catálogo.');
    }
}
