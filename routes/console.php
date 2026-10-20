<?php

use App\Models\Instituicao;
use App\Services\GeocodingService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Preenche latitude/longitude das instituições cadastradas antes do
// geocoding existir no cadastro (ou cujo endereço o Nominatim não achou).
// Uma requisição por segundo, como pede a política de uso do Nominatim.
Artisan::command('instituicoes:geocodificar', function (GeocodingService $geocoding) {
    $pendentes = Instituicao::whereNull('latitude')->orWhereNull('longitude')->get();

    if ($pendentes->isEmpty()) {
        $this->info('Todas as instituições já têm localização.');

        return;
    }

    foreach ($pendentes as $i => $instituicao) {
        if ($i > 0) {
            sleep(1);
        }

        $coords = $geocoding->geocodeEndereco($instituicao->endereco_completo);

        if ($coords === null) {
            $this->warn("Não encontrado: #{$instituicao->usuario_id} {$instituicao->nome_fantasia} ({$instituicao->endereco_completo})");

            continue;
        }

        $instituicao->update(['latitude' => $coords['lat'], 'longitude' => $coords['lon']]);
        $this->info("Localizada: #{$instituicao->usuario_id} {$instituicao->nome_fantasia}");
    }
})->purpose('Geocodifica instituições sem latitude/longitude');
