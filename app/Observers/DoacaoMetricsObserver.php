<?php

namespace App\Observers;

use App\Models\Doacao;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Prometheus\CollectorRegistry;

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
