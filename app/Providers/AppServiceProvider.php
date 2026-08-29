<?php

namespace App\Providers;

use App\Models\Doacao;
use App\Models\Instituicao;
use App\Models\Transferencia;
use App\Observers\DoacaoMetricsObserver;
use App\Observers\InstituicaoObserver;
use App\Observers\TransferenciaMetricsObserver;
use Carbon\CarbonImmutable;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\APC;
use Prometheus\Storage\InMemory;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CollectorRegistry::class, function () {
            $storage = extension_loaded('apcu') && apcu_enabled()
                ? new APC
                : new InMemory;

            return new CollectorRegistry($storage);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        Instituicao::observe(InstituicaoObserver::class);

        $this->configureMetrics();
    }

    /**
     * Instrumentacao de negocio: contadores que alimentam o Prometheus.
     */
    protected function configureMetrics(): void
    {
        Doacao::observe(DoacaoMetricsObserver::class);
        Transferencia::observe(TransferenciaMetricsObserver::class);

        // Rotulado por connection, nunca pela mensagem da exception: texto de
        // erro tem cardinalidade infinita e derruba o Prometheus.
        Queue::failing(function (JobFailed $event): void {
            app(CollectorRegistry::class)->getOrRegisterCounter(
                'impacta',
                'jobs_falhados_total',
                'Jobs que falharam apos esgotar as tentativas',
                ['connection'],
            )->inc([$event->connectionName]);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
