<?php

use App\Models\CategoriaItem;
use App\Models\Doador;
use App\Models\Instituicao;
use App\Models\Necessidade;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

// Rio de Janeiro — origem usada nos testes de proximidade.
const RF4_LAT = -22.9068;
const RF4_LNG = -43.1729;

function doadorComLocalizacao(?float $lat = RF4_LAT, ?float $lng = RF4_LNG): User
{
    $user = User::factory()->create(['tipo_usuario' => 'doador']);

    Doador::create([
        'usuario_id' => $user->id,
        'nome_completo' => 'Doador RF4',
        'cpf' => fake()->unique()->numerify('###########'),
        'telefone' => '11999999999',
        'latitude' => $lat,
        'longitude' => $lng,
    ]);

    return $user->fresh();
}

function instituicaoEm(string $nome, ?float $lat, ?float $lng): Instituicao
{
    $user = User::factory()->create(['tipo_usuario' => 'instituicao']);

    return Instituicao::factory()->create([
        'usuario_id' => $user->id,
        'nome_fantasia' => $nome,
        'status' => 'approved',
        'latitude' => $lat,
        'longitude' => $lng,
    ]);
}

function necessidadeAtiva(Instituicao $instituicao, CategoriaItem $categoria, int $objetivo = 10, int $atual = 0): Necessidade
{
    return Necessidade::create([
        'instituicao_id' => $instituicao->usuario_id,
        'categoria_id' => $categoria->id,
        'descricao' => 'Necessidade de teste',
        'quantidade_objetivo' => $objetivo,
        'quantidade_atual' => $atual,
        'prioridade' => 'media',
    ]);
}

test('filtra instituições por categoria de necessidade ativa', function () {
    $doador = doadorComLocalizacao();
    $roupas = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);
    $alimentos = CategoriaItem::firstOrCreate(['nome' => 'Alimentos']);

    $comRoupas = instituicaoEm('Precisa de Roupas', RF4_LAT, RF4_LNG);
    necessidadeAtiva($comRoupas, $roupas);

    $comAlimentos = instituicaoEm('Precisa de Alimentos', RF4_LAT, RF4_LNG);
    necessidadeAtiva($comAlimentos, $alimentos);

    $this->actingAs($doador)
        ->get(route('instituicoes.index', ['categoria' => $roupas->id]))
        ->assertInertia(fn ($page) => $page
            ->has('instituicoes.data', 1)
            ->where('instituicoes.data.0.nome_fantasia', 'Precisa de Roupas')
        );
});

test('necessidade já suprida não conta para o filtro de categoria', function () {
    $doador = doadorComLocalizacao();
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);

    $suprida = instituicaoEm('Necessidade Suprida', RF4_LAT, RF4_LNG);
    necessidadeAtiva($suprida, $categoria, objetivo: 10, atual: 10);

    $this->actingAs($doador)
        ->get(route('instituicoes.index', ['categoria' => $categoria->id]))
        ->assertInertia(fn ($page) => $page->has('instituicoes.data', 0));
});

test('filtra instituições dentro de um raio de proximidade', function () {
    $doador = doadorComLocalizacao();
    instituicaoEm('Perto', -22.95, -43.20);
    instituicaoEm('Longe', -23.5505, -46.6333); // São Paulo, ~360km do Rio

    $this->actingAs($doador)
        ->get(route('instituicoes.index', ['raio' => 10]))
        ->assertInertia(fn ($page) => $page
            ->has('instituicoes.data', 1)
            ->where('instituicoes.data.0.nome_fantasia', 'Perto')
        );
});

test('ordena por proximidade, mais perto primeiro, quando raio é informado', function () {
    $doador = doadorComLocalizacao();
    instituicaoEm('Media', -23.0, -43.3);
    instituicaoEm('Perto', -22.91, -43.18);

    $this->actingAs($doador)
        ->get(route('instituicoes.index', ['raio' => 500]))
        ->assertInertia(fn ($page) => $page
            ->where('instituicoes.data.0.nome_fantasia', 'Perto')
            ->where('instituicoes.data.1.nome_fantasia', 'Media')
        );
});

test('instituição sem localização cadastrada é excluída do filtro de raio', function () {
    $doador = doadorComLocalizacao();
    instituicaoEm('Com Local', RF4_LAT, RF4_LNG);
    instituicaoEm('Sem Local', null, null);

    $this->actingAs($doador)
        ->get(route('instituicoes.index', ['raio' => 50]))
        ->assertInertia(fn ($page) => $page
            ->has('instituicoes.data', 1)
            ->where('instituicoes.data.0.nome_fantasia', 'Com Local')
        );
});

test('doador sem localização cadastrada não quebra ao filtrar por raio', function () {
    $doador = doadorComLocalizacao(null, null);
    instituicaoEm('Qualquer', RF4_LAT, RF4_LNG);

    $this->actingAs($doador)
        ->get(route('instituicoes.index', ['raio' => 10]))
        ->assertOk();
});

test('API: filtros de categoria e raio devolvem distancia_km calculada no banco', function () {
    $doador = doadorComLocalizacao();
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);
    instituicaoEm('Perto API', -22.95, -43.20);
    $perto = Instituicao::where('nome_fantasia', 'Perto API')->firstOrFail();
    necessidadeAtiva($perto, $categoria);

    Sanctum::actingAs($doador, ['*']);

    $response = $this->getJson('/api/instituicoes?categoria='.$categoria->id.'&raio=50')
        ->assertOk()
        ->assertJsonPath('data.0.nome_fantasia', 'Perto API');

    expect($response->json('data.0.distancia_km'))->not->toBeNull();
});
