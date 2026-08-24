<?php

use App\Models\CategoriaItem;
use App\Models\Instituicao;
use App\Models\Necessidade;

test('instituição recém-registrada não pode criar necessidade antes de ser aprovada', function () {
    ['token' => $token] = registrarInstituicao();

    test()->postJson('/api/necessidades', [
        'categoria_id' => 1,
        'descricao' => 'Roupas de inverno',
        'quantidade_objetivo' => 10,
        'prioridade' => 'media',
    ], bearer($token))->assertForbidden();
});

test('fluxo completo: registro, aprovação, horário e CRUD de necessidades', function () {
    CategoriaItem::create(['nome' => 'Roupas']);
    $categoria = CategoriaItem::first();

    ['token' => $token, 'usuario_id' => $usuarioId] = registrarInstituicao();
    $instituicao = Instituicao::findOrFail($usuarioId);
    expect($instituicao->status)->toBe('pending');

    $admin = criarAdminUser();
    $adminToken = $admin->createToken('test')->plainTextToken;

    $approveResponse = test()->postJson("/api/admin/institutions/{$usuarioId}/approve", [], bearer($adminToken));
    $approveResponse->assertOk()->assertJsonPath('data.status', 'approved');

    // Ainda sem horário cadastrado: 422.
    test()->postJson('/api/necessidades', [
        'categoria_id' => $categoria->id,
        'descricao' => 'Roupas de inverno',
        'quantidade_objetivo' => 10,
        'prioridade' => 'media',
    ], bearer($token))->assertUnprocessable();

    $horarioResponse = test()->postJson('/api/horarios', [
        'dia_semana' => 1,
        'hora_inicio' => '08:00',
        'hora_fim' => '12:00',
        'tipo' => 'entrega',
    ], bearer($token));
    $horarioResponse->assertCreated();

    $storeResponse = test()->postJson('/api/necessidades', [
        'categoria_id' => $categoria->id,
        'descricao' => 'Roupas de inverno',
        'quantidade_objetivo' => 10,
        'prioridade' => 'media',
    ], bearer($token));
    $storeResponse->assertCreated()->assertJsonPath('data.descricao', 'Roupas de inverno');
    $necessidadeId = $storeResponse->json('data.id');

    test()->getJson('/api/necessidades', bearer($token))
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $updateResponse = test()->putJson("/api/necessidades/{$necessidadeId}", [
        'categoria_id' => $categoria->id,
        'descricao' => 'Roupas de inverno atualizada',
        'quantidade_objetivo' => 20,
        'prioridade' => 'alta',
    ], bearer($token));
    $updateResponse->assertOk()->assertJsonPath('data.descricao', 'Roupas de inverno atualizada');

    test()->deleteJson("/api/necessidades/{$necessidadeId}", [], bearer($token))
        ->assertNoContent();

    expect(Necessidade::find($necessidadeId))->toBeNull();
});

test('instituição não pode alterar necessidade de outra instituição', function () {
    CategoriaItem::create(['nome' => 'Alimentos']);
    $categoria = CategoriaItem::first();

    $admin = criarAdminUser();
    $adminToken = $admin->createToken('test')->plainTextToken;

    ['token' => $tokenA, 'usuario_id' => $usuarioIdA] = registrarInstituicao();
    test()->postJson("/api/admin/institutions/{$usuarioIdA}/approve", [], bearer($adminToken));
    test()->postJson('/api/horarios', [
        'dia_semana' => 2, 'hora_inicio' => '09:00', 'hora_fim' => '11:00', 'tipo' => 'coleta',
    ], bearer($tokenA));
    $necessidade = test()->postJson('/api/necessidades', [
        'categoria_id' => $categoria->id, 'descricao' => 'Item da instituição A', 'quantidade_objetivo' => 5, 'prioridade' => 'baixa',
    ], bearer($tokenA))->json('data.id');

    ['token' => $tokenB, 'usuario_id' => $usuarioIdB] = registrarInstituicao();
    test()->postJson("/api/admin/institutions/{$usuarioIdB}/approve", [], bearer($adminToken));

    test()->deleteJson("/api/necessidades/{$necessidade}", [], bearer($tokenB))
        ->assertForbidden();
});
