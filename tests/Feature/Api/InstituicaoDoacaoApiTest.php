<?php

use App\Models\User;

test('instituição consegue listar, confirmar, entregar e avaliar uma doação', function () {
    $instituicao = criarInstituicaoComHorario();
    $instituicaoUser = User::find($instituicao->usuario_id);
    $instituicaoToken = $instituicaoUser->createToken('test')->plainTextToken;

    $doacao = criarDoacaoPendente($instituicao);

    test()->getJson('/api/instituicao/doacoes', bearer($instituicaoToken))
        ->assertOk()
        ->assertJsonCount(1, 'data');

    test()->postJson("/api/instituicao/doacoes/{$doacao->id}/confirm", [], bearer($instituicaoToken))
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmada');

    test()->postJson("/api/instituicao/doacoes/{$doacao->id}/deliver", [], bearer($instituicaoToken))
        ->assertOk()
        ->assertJsonPath('data.status', 'entregue');

    test()->postJson("/api/instituicao/doacoes/{$doacao->id}/avaliar", [
        'nota' => 5,
        'descricao' => 'Doação impecável, itens em ótimo estado.',
    ], bearer($instituicaoToken))
        ->assertCreated()
        ->assertJsonPath('data.nota', 5);
});

test('instituição consegue recusar uma doação pendente', function () {
    $instituicao = criarInstituicaoComHorario();
    $instituicaoUser = User::find($instituicao->usuario_id);
    $instituicaoToken = $instituicaoUser->createToken('test')->plainTextToken;

    $doacao = criarDoacaoPendente($instituicao);

    test()->postJson("/api/instituicao/doacoes/{$doacao->id}/reject", [], bearer($instituicaoToken))
        ->assertOk()
        ->assertJsonPath('data.status', 'recusada');
});

test('instituição consegue marcar doação confirmada como não entregue', function () {
    $instituicao = criarInstituicaoComHorario();
    $instituicaoUser = User::find($instituicao->usuario_id);
    $instituicaoToken = $instituicaoUser->createToken('test')->plainTextToken;

    $doacao = criarDoacaoPendente($instituicao, 'confirmada');

    test()->postJson("/api/instituicao/doacoes/{$doacao->id}/notDelivered", [], bearer($instituicaoToken))
        ->assertOk()
        ->assertJsonPath('data.status', 'nao_entregue');
});

test('instituição não pode confirmar doação de outra instituição', function () {
    $instituicaoA = criarInstituicaoComHorario();
    $instituicaoB = criarInstituicaoComHorario();
    $tokenB = User::find($instituicaoB->usuario_id)->createToken('test')->plainTextToken;

    $doacao = criarDoacaoPendente($instituicaoA);

    test()->postJson("/api/instituicao/doacoes/{$doacao->id}/confirm", [], bearer($tokenB))
        ->assertForbidden();
});

test('não é possível confirmar duas vezes a mesma doação', function () {
    $instituicao = criarInstituicaoComHorario();
    $token = User::find($instituicao->usuario_id)->createToken('test')->plainTextToken;

    $doacao = criarDoacaoPendente($instituicao);

    test()->postJson("/api/instituicao/doacoes/{$doacao->id}/confirm", [], bearer($token))->assertOk();
    test()->postJson("/api/instituicao/doacoes/{$doacao->id}/confirm", [], bearer($token))->assertUnprocessable();
});
