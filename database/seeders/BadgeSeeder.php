<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Services\GamificacaoService;
use Illuminate\Database\Seeder;

/**
 * Catálogo de badges da gamificação (RF20). A avaliação das regras fica em
 * GamificacaoService; aqui só se declara o que cada badge exige.
 */
class BadgeSeeder extends Seeder
{
    private const BADGES = [
        [
            'codigo' => 'primeira-doacao',
            'nome' => 'Primeira Doação',
            'descricao' => 'Concluiu a primeira doação na plataforma.',
            'regra' => GamificacaoService::REGRA_DOACOES,
            'limiar' => 1,
        ],
        [
            'codigo' => 'doador-constante',
            'nome' => 'Doador Constante',
            'descricao' => 'Realizou cinco doações entregues.',
            'regra' => GamificacaoService::REGRA_DOACOES,
            'limiar' => 5,
        ],
        [
            'codigo' => 'parceiro-das-causas',
            'nome' => 'Parceiro das Causas',
            'descricao' => 'Apoiou três causas diferentes.',
            'regra' => GamificacaoService::REGRA_CAUSAS,
            'limiar' => 3,
        ],
        [
            'codigo' => 'impacto-local',
            'nome' => 'Impacto Local',
            'descricao' => 'Doou para cinco instituições distintas.',
            'regra' => GamificacaoService::REGRA_INSTITUICOES,
            'limiar' => 5,
        ],
        [
            'codigo' => 'referencia-solidaria',
            'nome' => 'Referência Solidária',
            'descricao' => 'Alcançou 700 pontos de gamificação.',
            'regra' => GamificacaoService::REGRA_PONTOS,
            'limiar' => 700,
        ],
    ];

    public function run(): void
    {
        foreach (self::BADGES as $badge) {
            Badge::updateOrCreate(
                ['nome' => $badge['nome']],
                $badge + [
                    'imagem_url' => '/badges/'.$badge['codigo'].'.png',
                    'requisito_pontos' => $badge['regra'] === GamificacaoService::REGRA_PONTOS ? $badge['limiar'] : 0,
                ],
            );
        }

        $this->command?->info('Badges: '.Badge::count().' no catálogo.');
    }
}
