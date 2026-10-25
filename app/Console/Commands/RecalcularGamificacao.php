<?php

namespace App\Console\Commands;

use App\Enums\DoacaoStatus;
use App\Models\Doacao;
use App\Services\GamificacaoService;
use Database\Seeders\BadgeSeeder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('gamificacao:recalcular')]
#[Description('Gera pontos e badges retroativos para as doações já entregues (idempotente).')]
class RecalcularGamificacao extends Command
{
    public function handle(GamificacaoService $gamificacao): int
    {
        (new BadgeSeeder)->run();

        $total = 0;
        $badges = 0;

        Doacao::where('status', DoacaoStatus::Entregue)
            ->orderByRaw('coalesce(data_entrega, created_at)')
            ->orderBy('id')
            ->each(function (Doacao $doacao) use ($gamificacao, &$total, &$badges) {
                $badges += count($gamificacao->registrarEntrega($doacao, notificar: false));
                $total++;
            });

        $this->info("{$total} doações processadas, {$badges} badges concedidos.");

        return self::SUCCESS;
    }
}
