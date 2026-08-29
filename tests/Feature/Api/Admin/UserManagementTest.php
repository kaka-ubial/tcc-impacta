<?php

test('non-admin token cannot access admin users endpoint', function () {
    $doador = criarDoadorUser();
    $token = $doador->createToken('token')->plainTextToken;

    $response = $this->getJson('/api/admin/users', bearer($token));

    $response->assertForbidden();
});

test('admin lists users via the api with filters', function () {
    $admin = criarAdminUser();
    $adminToken = $admin->createToken('token')->plainTextToken;
    criarDoadorUser();
    criarInstituicaoComHorario();

    $response = $this->getJson('/api/admin/users?tipo_usuario=instituicao', bearer($adminToken));

    $response->assertOk();
    $response->assertJsonCount(1, 'data');
    $response->assertJsonPath('data.0.tipo_usuario', 'instituicao');
});

test('admin suspends a user via the api and their token stops working', function () {
    $admin = criarAdminUser();
    $adminToken = $admin->createToken('admin-token')->plainTextToken;

    $doador = criarDoadorUser();
    $doadorToken = $doador->createToken('doador-token')->plainTextToken;

    $this->getJson('/api/me', bearer($doadorToken))->assertOk();

    $response = $this->patchJson("/api/admin/users/{$doador->id}/status", [
        'status' => 'suspenso',
        'motivo' => 'violação dos termos de uso',
    ], bearer($adminToken));

    $response->assertOk();
    $response->assertJsonPath('data.status', 'suspenso');

    expect($doador->fresh()->motivo_suspensao)->toBe('violação dos termos de uso');

    // O token que estava ativo antes da suspensão foi invalidado.
    $this->getJson('/api/me', bearer($doadorToken))->assertUnauthorized();
});

test('admin cannot suspend themselves via the api', function () {
    $admin = criarAdminUser();
    $token = $admin->createToken('token')->plainTextToken;

    $response = $this->patchJson("/api/admin/users/{$admin->id}/status", [
        'status' => 'suspenso',
    ], bearer($token));

    $response->assertForbidden();
});
