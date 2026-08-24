<?php

use App\Models\Instituicao;
use App\Models\User;

test('endpoint de instituições exige token', function () {
    test()->getJson('/api/instituicoes')->assertUnauthorized();
});

test('doador consegue listar instituições visíveis', function () {
    $doadorUser = criarDoadorUser();
    $token = $doadorUser->createToken('test')->plainTextToken;

    $visivel = criarInstituicaoComHorario();

    $rejeitadaUser = User::factory()->create(['tipo_usuario' => 'instituicao', 'status' => 'ativo']);
    $rejeitada = Instituicao::factory()->create(['usuario_id' => $rejeitadaUser->id, 'status' => 'rejected']);

    $response = test()->getJson('/api/instituicoes', bearer($token));

    $response->assertOk();
    $ids = collect($response->json('data'))->pluck('usuario_id');
    expect($ids)->toContain($visivel->usuario_id);
    expect($ids)->not->toContain($rejeitada->usuario_id);
});

test('instituição não vê a si mesma na listagem', function () {
    $instituicao = criarInstituicaoComHorario();
    $token = User::find($instituicao->usuario_id)->createToken('test')->plainTextToken;

    $outra = criarInstituicaoComHorario();

    $response = test()->getJson('/api/instituicoes', bearer($token));

    $ids = collect($response->json('data'))->pluck('usuario_id');
    expect($ids)->not->toContain($instituicao->usuario_id);
    expect($ids)->toContain($outra->usuario_id);
});

test('busca por nome filtra a listagem', function () {
    $doadorUser = criarDoadorUser();
    $token = $doadorUser->createToken('test')->plainTextToken;

    $alvoUser = User::factory()->create(['tipo_usuario' => 'instituicao', 'status' => 'ativo']);
    $alvo = Instituicao::factory()->create([
        'usuario_id' => $alvoUser->id,
        'status' => 'approved',
        'nome_fantasia' => 'Instituto Esperança Curitiba',
    ]);

    criarInstituicaoComHorario();

    $response = test()->getJson('/api/instituicoes?search=Esperança', bearer($token));

    $ids = collect($response->json('data'))->pluck('usuario_id');
    expect($ids)->toContain($alvo->usuario_id)->toHaveCount(1);
});

test('detalhe da instituição traz causas, necessidades e horários', function () {
    $doadorUser = criarDoadorUser();
    $token = $doadorUser->createToken('test')->plainTextToken;

    $instituicao = criarInstituicaoComHorario();

    test()->getJson("/api/instituicoes/{$instituicao->usuario_id}", bearer($token))
        ->assertOk()
        ->assertJsonPath('data.usuario_id', $instituicao->usuario_id)
        ->assertJsonStructure(['data' => ['causas', 'necessidades_ativas', 'horarios_disponiveis']]);
});

test('doador consegue ver instituições recomendadas', function () {
    $doadorUser = criarDoadorUser();
    $token = $doadorUser->createToken('test')->plainTextToken;

    criarInstituicaoComHorario();

    test()->getJson('/api/instituicoes/recomendadas', bearer($token))
        ->assertOk()
        ->assertJsonStructure(['data' => [['usuario_id', 'nome_fantasia', 'causas', 'causa_overlap', 'distancia_km']]]);
});

test('instituição não pode acessar recomendadas', function () {
    $instituicao = criarInstituicaoComHorario();
    $token = User::find($instituicao->usuario_id)->createToken('test')->plainTextToken;

    test()->getJson('/api/instituicoes/recomendadas', bearer($token))->assertForbidden();
});
