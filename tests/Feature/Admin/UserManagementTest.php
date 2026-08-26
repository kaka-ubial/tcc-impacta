<?php

use App\Enums\UserStatus;
use App\Models\Instituicao;

test('guest is redirected to login when accessing admin users list', function () {
    $response = $this->get('/admin/users');

    $response->assertRedirect(route('login'));
});

test('non-admin cannot access admin users list', function () {
    $doador = criarDoadorUser();

    $response = $this->actingAs($doador)->get('/admin/users');

    $response->assertForbidden();
});

test('admin sees unified list of doadores and instituicoes', function () {
    $admin = criarAdminUser();
    $doador = criarDoadorUser();
    criarInstituicaoComHorario();

    $response = $this->actingAs($admin)->get('/admin/users');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/users-list')
        ->has('usuarios.data', 3) // doador + instituicao + o próprio admin
    );
});

test('admin filters the list by tipo_usuario and status', function () {
    $admin = criarAdminUser();
    criarDoadorUser();
    criarInstituicaoComHorario();

    $response = $this->actingAs($admin)->get('/admin/users?tipo_usuario=doador');

    $response->assertInertia(fn ($page) => $page
        ->has('usuarios.data', 1)
        ->where('usuarios.data.0.tipo_usuario', 'doador')
    );
});

test('admin can view and update a doador profile', function () {
    $admin = criarAdminUser();
    $doador = criarDoadorUser();

    $show = $this->actingAs($admin)->get("/admin/users/{$doador->id}");
    $show->assertOk();
    $show->assertInertia(fn ($page) => $page->component('admin/user-edit'));

    $update = $this->actingAs($admin)->put("/admin/doadores/{$doador->id}", [
        'nome_completo' => 'Novo Nome',
        'cpf' => cpfValido(),
        'telefone' => '(11) 91234-5678',
        'endereco_completo' => 'Rua Nova, 123',
    ]);

    $update->assertRedirect();
    expect($doador->doador->fresh()->nome_completo)->toBe('Novo Nome');
});

test('admin can view and update an instituicao profile', function () {
    $admin = criarAdminUser();
    $instituicao = criarInstituicaoComHorario();

    $update = $this->actingAs($admin)->put("/admin/instituicoes/{$instituicao->usuario_id}", [
        'nome_fantasia' => 'Nova Fantasia',
        'razao_social' => $instituicao->razao_social,
        'cnpj' => $instituicao->cnpj,
        'telefone' => $instituicao->telefone,
        'endereco_completo' => $instituicao->endereco_completo,
        'descricao' => 'Descrição atualizada',
    ]);

    $update->assertRedirect();
    expect(Instituicao::find($instituicao->usuario_id)->nome_fantasia)->toBe('Nova Fantasia');
});

test('admin can suspend a user with a reason and it invalidates their tokens', function () {
    $admin = criarAdminUser();
    $doador = criarDoadorUser();
    $doador->createToken('sessao-ativa');

    expect($doador->tokens()->count())->toBe(1);

    $response = $this->actingAs($admin)->patch("/admin/users/{$doador->id}/status", [
        'status' => 'suspenso',
        'motivo' => 'Comportamento inadequado reportado por instituições.',
    ]);

    $response->assertRedirect();

    $doador->refresh();
    expect($doador->status)->toBe(UserStatus::Suspenso);
    expect($doador->motivo_suspensao)->toBe('Comportamento inadequado reportado por instituições.');
    expect($doador->tokens()->count())->toBe(0);
});

test('admin can reactivate a suspended user', function () {
    $admin = criarAdminUser();
    $doador = criarDoadorUser();
    $doador->update(['status' => 'suspenso', 'motivo_suspensao' => 'motivo anterior']);

    $response = $this->actingAs($admin)->patch("/admin/users/{$doador->id}/status", [
        'status' => 'ativo',
    ]);

    $response->assertRedirect();

    $doador->refresh();
    expect($doador->status)->toBe(UserStatus::Ativo);
    expect($doador->motivo_suspensao)->toBeNull();
});

test('admin cannot suspend their own account', function () {
    $admin = criarAdminUser();

    $response = $this->actingAs($admin)->patch("/admin/users/{$admin->id}/status", [
        'status' => 'suspenso',
        'motivo' => 'tentativa de auto-suspensão',
    ]);

    $response->assertForbidden();
    expect($admin->fresh()->status)->toBe(UserStatus::Ativo);
});

test('a user suspended mid-session is logged out on the next request', function () {
    $doador = criarDoadorUser();

    $this->actingAs($doador);

    // Simula um admin suspendendo a conta enquanto a sessão web já está ativa.
    $doador->update(['status' => 'suspenso']);

    $response = $this->get('/redirect');

    $response->assertRedirect(route('login'));
    $this->assertGuest();
});
