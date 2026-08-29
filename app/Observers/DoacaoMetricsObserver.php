<?php

namespace App\Observers;

use App\Models\Doacao;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Prometheus\CollectorRegistry;

/**
 * Conta as entradas de doacoes em cada status, para o Prometheus.
 *
 * Implementa ShouldHandleEventsAfterCommit porque varios metodos do
 * DoacaoService rodam dentro de DB::transaction(): sem isso, um rollback
 * deixaria o contador incrementado para uma doacao que nunca existiu.
 */
class DoacaoMetricsObserver implements ShouldHandleEventsAfterCommit
{
    public function __construct(private readonly CollectorRegistry $registry) {}

    public function created(Doacao $doacao): void
    {
        $this->conta($doacao->status->value);
    }

    public function updated(Doacao $doacao): void
    {
        if ($doacao->wasChanged('status')) {
            $this->conta($doacao->status->value);
        }
    }

    private function conta(string $status): void
    {
        $this->registry->getOrRegisterCounter(
            'impacta',
            'doacoes_total',
            'Doacoes que entraram em cada status',
            ['status'],
        )->inc([$status]);
    }
}
