<?php

use App\Models\Agendamento;
use App\Models\Doacao;
use App\Models\Instituicao;
use App\Models\User;

function criarAgendamentoParaInstituicao(Instituicao $instituicao): Agendamento
{
    $doadorUser = criarDoadorUser();

    $doacao = Doacao::create([
        'doador_id' => $doadorUser->doador->usuario_id,
        'instituicao_id' => $instituicao->usuario_id,
        'status' => 'confirmada',
    ]);

    return Agendamento::create([
        'doacao_id' => $doacao->id,
        'data_hora' => now()->addDays(3),
        'tipo' => 'entrega',
        'status' => 'confirmado',
    ]);
}

test('instituição consegue listar sua agenda', function () {
    $instituicao = criarInstituicaoComHorario();
    $token = User::find($instituicao->usuario_id)->createToken('test')->plainTextToken;

    criarAgendamentoParaInstituicao($instituicao);

    $response = test()->getJson('/api/agenda', bearer($token));

    $response->assertOk()
        ->assertJsonStructure(['agendamentos', 'horarios', 'transferencias'])
        ->assertJsonCount(1, 'agendamentos')
        ->assertJsonCount(1, 'horarios');
});

test('instituição consegue sugerir nova data para um agendamento', function () {
    $instituicao = criarInstituicaoComHorario();
    $token = User::find($instituicao->usuario_id)->createToken('test')->plainTextToken;

    $agendamento = criarAgendamentoParaInstituicao($instituicao);
    $novaData = now()->addDays(10)->toIso8601String();

    $response = test()->postJson("/api/agendamentos/{$agendamento->id}/sugerir", [
        'data_hora_sugerida' => $novaData,
    ], bearer($token));

    $response->assertOk()->assertJsonPath('data.status', 'alteracao_sugerida');
});

test('instituição não pode sugerir data para agendamento de outra instituição', function () {
    $instituicaoA = criarInstituicaoComHorario();
    $instituicaoB = criarInstituicaoComHorario();
    $tokenB = User::find($instituicaoB->usuario_id)->createToken('test')->plainTextToken;

    $agendamento = criarAgendamentoParaInstituicao($instituicaoA);

    test()->postJson("/api/agendamentos/{$agendamento->id}/sugerir", [
        'data_hora_sugerida' => now()->addDays(10)->toIso8601String(),
    ], bearer($tokenB))->assertForbidden();
});
