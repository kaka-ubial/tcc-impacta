<?php

use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\Instituicao;
use App\Models\User;

test('login retorna um token bearer para credenciais válidas', function () {
    $user = criarDoadorUser('minha-senha');

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'minha-senha',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['token', 'user' => ['id', 'email', 'tipo_usuario']]);
});

test('login rejeita credenciais inválidas', function () {
    $user = criarDoadorUser('minha-senha');

    $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'senha-errada',
    ])->assertUnprocessable();
});

test('endpoints protegidos exigem token', function () {
    $this->getJson('/api/doacoes')->assertUnauthorized();
});

test('doador autenticado consegue listar e criar doações via API', function () {
    $doadorUser = criarDoadorUser();
    $instituicao = criarInstituicaoComHorario();
    $categoria = CategoriaItem::create(['nome' => 'Roupas']);

    $token = $doadorUser->createToken('test')->plainTextToken;

    $this->getJson('/api/doacoes', ['Authorization' => "Bearer $token"])
        ->assertOk()
        ->assertJson(['data' => []]);

    $payload = [
        'instituicao_id' => $instituicao->usuario_id,
        'itens' => [
            ['categoria_id' => $categoria->id, 'quantidade' => 2, 'descricao' => 'Casacos'],
        ],
        'agendamento' => [
            'tipo' => 'entrega',
            'data_hora' => now()->addDays(2)->toIso8601String(),
        ],
    ];

    $storeResponse = $this->postJson('/api/doacoes', $payload, ['Authorization' => "Bearer $token"]);

    $storeResponse->assertCreated()
        ->assertJsonPath('data.status', 'pendente')
        ->assertJsonPath('data.instituicao.id', $instituicao->usuario_id);

    $doacaoId = $storeResponse->json('data.id');

    $this->getJson('/api/doacoes', ['Authorization' => "Bearer $token"])
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->postJson("/api/doacoes/{$doacaoId}/cancel", [], ['Authorization' => "Bearer $token"])
        ->assertNoContent();

    expect(Doacao::find($doacaoId)->status)->toBe('cancelado');
});

test('API rejeita doação para instituição sem horários disponíveis', function () {
    $doadorUser = criarDoadorUser();
    $categoria = CategoriaItem::create(['nome' => 'Alimentos']);

    $semHorarioUser = User::factory()->create(['tipo_usuario' => 'instituicao', 'status' => 'ativo']);
    $instituicaoSemHorario = Instituicao::factory()->create([
        'usuario_id' => $semHorarioUser->id,
        'status' => 'approved',
    ]);

    $token = $doadorUser->createToken('test')->plainTextToken;

    $this->postJson('/api/doacoes', [
        'instituicao_id' => $instituicaoSemHorario->usuario_id,
        'itens' => [
            ['categoria_id' => $categoria->id, 'quantidade' => 1],
        ],
        'agendamento' => [
            'tipo' => 'entrega',
            'data_hora' => now()->addDays(2)->toIso8601String(),
        ],
    ], ['Authorization' => "Bearer $token"])->assertUnprocessable();
});

test('doador não pode cancelar doação de outro doador', function () {
    $doadorUser = criarDoadorUser();
    $outroDoadorUser = criarDoadorUser();
    $instituicao = criarInstituicaoComHorario();

    $doacao = Doacao::create([
        'doador_id' => $outroDoadorUser->doador->usuario_id,
        'instituicao_id' => $instituicao->usuario_id,
        'status' => 'pendente',
    ]);

    $token = $doadorUser->createToken('test')->plainTextToken;

    $this->postJson("/api/doacoes/{$doacao->id}/cancel", [], ['Authorization' => "Bearer $token"])
        ->assertForbidden();
});
