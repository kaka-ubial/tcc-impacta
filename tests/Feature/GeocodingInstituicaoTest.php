<?php

use App\Models\Instituicao;
use App\Services\GeocodingService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

function fakeNominatim(?array $coords): void
{
    Http::fake(['nominatim.openstreetmap.org/*' => Http::response(
        $coords ? [['lat' => (string) $coords[0], 'lon' => (string) $coords[1]]] : []
    )]);
}

test('cadastro de instituição grava as coordenadas do endereço', function () {
    fakeNominatim([-25.4352, -49.2828]);

    $dados = registrarInstituicao();
    $instituicao = Instituicao::find($dados['usuario_id']);

    expect($instituicao->latitude)->toBe(-25.4352)
        ->and($instituicao->longitude)->toBe(-49.2828);

    Http::assertSent(fn (Request $r) => str_contains($r->header('User-Agent')[0] ?? '', config('app.name')));
});

test('se o endereço completo não é achado, tenta logradouro + cidade/UF', function () {
    Http::fake(['nominatim.openstreetmap.org/*' => Http::sequence()
        ->push([])
        ->push([['lat' => '-25.43', 'lon' => '-49.28']])]);

    $coords = app(GeocodingService::class)
        ->geocodeEndereco('Rua Desembargador Motta, 2290 - Apto 1901 - Centro - Curitiba/PR - CEP 80420-000');

    expect($coords)->toBe(['lat' => -25.43, 'lon' => -49.28]);
    Http::assertSent(fn (Request $r) => $r['q'] === 'Rua Desembargador Motta, 2290, Curitiba, PR, Brasil');
});

test('admin muda o endereço e a localização é recalculada; outros campos não geocodificam', function () {
    $instituicao = criarInstituicaoComHorario();
    $admin = criarAdminUser();
    $dados = [
        'nome_fantasia' => 'Novo Nome',
        'razao_social' => $instituicao->razao_social,
        'cnpj' => cnpjValido(),
        'telefone' => '(41) 99999-0000',
        'endereco_completo' => $instituicao->endereco_completo,
    ];

    fakeNominatim([-10.0, -20.0]);
    $this->actingAs($admin)->put("/admin/instituicoes/{$instituicao->usuario_id}", $dados)->assertSessionHasNoErrors();
    Http::assertNothingSent();

    $this->actingAs($admin)->put("/admin/instituicoes/{$instituicao->usuario_id}", [
        ...$dados,
        'endereco_completo' => 'Rua Nova, 10 - Centro - Curitiba/PR',
    ])->assertSessionHasNoErrors();

    expect($instituicao->fresh()->latitude)->toBe(-10.0)
        ->and($instituicao->fresh()->longitude)->toBe(-20.0);
});

test('endereço não encontrado deixa a instituição sem localização, sem quebrar', function () {
    fakeNominatim(null);

    $dados = registrarInstituicao();

    expect(Instituicao::find($dados['usuario_id'])->latitude)->toBeNull();
});

test('comando preenche só as instituições sem coordenadas', function () {
    $semLocal = criarInstituicaoComHorario();
    $semLocal->update(['latitude' => null, 'longitude' => null]);
    $comLocal = criarInstituicaoComHorario();
    $latOriginal = $comLocal->latitude;

    fakeNominatim([-25.5, -49.3]);

    $this->artisan('instituicoes:geocodificar')->assertSuccessful();

    expect($semLocal->fresh()->latitude)->toBe(-25.5)
        ->and($comLocal->fresh()->latitude)->toBe($latOriginal);
});
