<?php

use App\Models\Doacao;
use App\Models\User;

test('doador consegue ver o próprio perfil', function () {
    $doadorUser = criarDoadorUser();
    $token = $doadorUser->createToken('test')->plainTextToken;

    test()->getJson('/api/perfil', bearer($token))
        ->assertOk()
        ->assertJsonPath('data.is_own_profile', true)
        ->assertJsonPath('data.usuario_id', $doadorUser->doador->usuario_id);
});

test('endpoint de perfil exige token', function () {
    test()->getJson('/api/perfil')->assertUnauthorized();
});

test('instituição consegue ver perfil de doador com quem já interagiu', function () {
    $instituicao = criarInstituicaoComHorario();
    $token = User::find($instituicao->usuario_id)->createToken('test')->plainTextToken;

    $doadorUser = criarDoadorUser();
    Doacao::create([
        'doador_id' => $doadorUser->doador->usuario_id,
        'instituicao_id' => $instituicao->usuario_id,
        'status' => 'entregue',
    ]);

    $response = test()->getJson("/api/instituicao/doadores/{$doadorUser->doador->usuario_id}", bearer($token));

    $response->assertOk()
        ->assertJsonPath('data.is_own_profile', false)
        ->assertJsonPath('data.estatisticas.doacoes_com_instituicao', 1);
});

test('instituição não pode ver perfil de doador sem doação com ela', function () {
    $instituicao = criarInstituicaoComHorario();
    $token = User::find($instituicao->usuario_id)->createToken('test')->plainTextToken;

    $doadorUser = criarDoadorUser();

    test()->getJson("/api/instituicao/doadores/{$doadorUser->doador->usuario_id}", bearer($token))
        ->assertForbidden();
});
