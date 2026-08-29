<?php

namespace App\Observers;

use App\Models\Transferencia;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Prometheus\CollectorRegistry;

/**
 * Conta as entradas de transferencias em cada status, para o Prometheus.
 *
 * Mesma razao do DoacaoMetricsObserver para o ShouldHandleEventsAfterCommit:
 * o TransferenciaService envolve varias transicoes em DB::transaction().
 */
class TransferenciaMetricsObserver implements ShouldHandleEventsAfterCommit
{
    public function __construct(private readonly CollectorRegistry $registry) {}

    public function created(Transferencia $transferencia): void
    {
        $this->conta($transferencia->status->value);
    }

    public function updated(Transferencia $transferencia): void
    {
        if ($transferencia->wasChanged('status')) {
            $this->conta($transferencia->status->value);
        }
    }

    private function conta(string $status): void
    {
        $this->registry->getOrRegisterCounter(
            'impacta',
            'transferencias_total',
            'Transferencias que entraram em cada status',
            ['status'],
        )->inc([$status]);
    }
}
