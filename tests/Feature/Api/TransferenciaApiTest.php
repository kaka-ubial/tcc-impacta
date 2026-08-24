<?php

use App\Models\CategoriaItem;
use App\Models\Transferencia;
use App\Models\User;

test('instituição com estoque consegue transferir itens para outra instituição', function () {
    $categoria = CategoriaItem::create(['nome' => 'Roupas']);
    $origem = criarInstituicaoComHorario();
    $destino = criarInstituicaoComHorario();
    darEstoque($origem, $categoria, 10);

    $tokenOrigem = User::find($origem->usuario_id)->createToken('test')->plainTextToken;

    $response = test()->postJson('/api/transferencias', [
        'instituicao_destino_id' => $destino->usuario_id,
        'itens' => [
            ['categoria_id' => $categoria->id, 'quantidade' => 4],
        ],
        'agendamento' => [
            'tipo' => 'entrega',
            'data_hora' => now()->addDays(2)->toIso8601String(),
        ],
    ], bearer($tokenOrigem));

    $response->assertCreated()
        ->assertJsonPath('data.status', 'pendente')
        ->assertJsonPath('data.direcao', 'enviada')
        ->assertJsonPath('data.parceiro.usuario_id', $destino->usuario_id);
});

test('instituição não pode transferir para si mesma', function () {
    $categoria = CategoriaItem::create(['nome' => 'Roupas']);
    $origem = criarInstituicaoComHorario();
    darEstoque($origem, $categoria, 10);

    $token = User::find($origem->usuario_id)->createToken('test')->plainTextToken;

    test()->postJson('/api/transferencias', [
        'instituicao_destino_id' => $origem->usuario_id,
        'itens' => [['categoria_id' => $categoria->id, 'quantidade' => 1]],
        'agendamento' => ['tipo' => 'entrega', 'data_hora' => now()->addDays(2)->toIso8601String()],
    ], bearer($token))->assertUnprocessable();
});

test('instituição não pode transferir mais do que tem em estoque', function () {
    $categoria = CategoriaItem::create(['nome' => 'Roupas']);
    $origem = criarInstituicaoComHorario();
    $destino = criarInstituicaoComHorario();
    darEstoque($origem, $categoria, 3);

    $token = User::find($origem->usuario_id)->createToken('test')->plainTextToken;

    test()->postJson('/api/transferencias', [
        'instituicao_destino_id' => $destino->usuario_id,
        'itens' => [['categoria_id' => $categoria->id, 'quantidade' => 100]],
        'agendamento' => ['tipo' => 'entrega', 'data_hora' => now()->addDays(2)->toIso8601String()],
    ], bearer($token))->assertUnprocessable();
});

test('fluxo completo: confirmar, entregar e sugerir/aceitar nova data', function () {
    $categoria = CategoriaItem::create(['nome' => 'Roupas']);
    $origem = criarInstituicaoComHorario();
    $destino = criarInstituicaoComHorario();
    darEstoque($origem, $categoria, 10);

    $tokenOrigem = User::find($origem->usuario_id)->createToken('test')->plainTextToken;
    $tokenDestino = User::find($destino->usuario_id)->createToken('test')->plainTextToken;

    $transferenciaId = test()->postJson('/api/transferencias', [
        'instituicao_destino_id' => $destino->usuario_id,
        'itens' => [['categoria_id' => $categoria->id, 'quantidade' => 2]],
        'agendamento' => ['tipo' => 'entrega', 'data_hora' => now()->addDays(2)->toIso8601String()],
    ], bearer($tokenOrigem))->json('data.id');

    // Só o destino confirma.
    test()->postJson("/api/transferencias/{$transferenciaId}/confirmar", [], bearer($tokenOrigem))
        ->assertForbidden();

    test()->postJson("/api/transferencias/{$transferenciaId}/confirmar", [], bearer($tokenDestino))
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmada');

    // Destino sugere nova data; origem aceita.
    $novaData = now()->addDays(5)->toIso8601String();
    test()->postJson("/api/transferencias/{$transferenciaId}/sugerir", [
        'data_hora_sugerida' => $novaData,
    ], bearer($tokenDestino))
        ->assertOk()
        ->assertJsonPath('data.status', 'alteracao_sugerida');

    test()->postJson("/api/transferencias/{$transferenciaId}/sugestao/aceitar", [], bearer($tokenOrigem))
        ->assertOk()
        ->assertJsonPath('data.status', 'pendente');

    // Reconfirma e entrega.
    test()->postJson("/api/transferencias/{$transferenciaId}/confirmar", [], bearer($tokenDestino))->assertOk();
    test()->postJson("/api/transferencias/{$transferenciaId}/entregar", [], bearer($tokenDestino))
        ->assertOk()
        ->assertJsonPath('data.status', 'entregue');
});

test('origem consegue cancelar transferência pendente', function () {
    $categoria = CategoriaItem::create(['nome' => 'Roupas']);
    $origem = criarInstituicaoComHorario();
    $destino = criarInstituicaoComHorario();
    darEstoque($origem, $categoria, 10);

    $tokenOrigem = User::find($origem->usuario_id)->createToken('test')->plainTextToken;

    $transferenciaId = test()->postJson('/api/transferencias', [
        'instituicao_destino_id' => $destino->usuario_id,
        'itens' => [['categoria_id' => $categoria->id, 'quantidade' => 1]],
        'agendamento' => ['tipo' => 'entrega', 'data_hora' => now()->addDays(2)->toIso8601String()],
    ], bearer($tokenOrigem))->json('data.id');

    test()->postJson("/api/transferencias/{$transferenciaId}/cancelar", [], bearer($tokenOrigem))
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelada');

    expect(Transferencia::find($transferenciaId)->status)->toBe('cancelada');
});
