<?php

use App\Models\Notificacao;
use App\Models\User;

function notificacaoPara(User $user, array $override = []): Notificacao
{
    return Notificacao::create(array_merge([
        'usuario_id' => $user->id,
        'titulo' => 'Doação confirmada',
        'mensagem' => 'Uma instituição confirmou a sua doação.',
        'url' => '/doacoes',
        'lida' => false,
    ], $override));
}

test('abrir marca como lida e redireciona para o destino', function () {
    $user = User::factory()->create(['tipo_usuario' => 'doador']);
    $n = notificacaoPara($user, ['url' => '/doacoes']);

    $this->actingAs($user)
        ->get(route('notificacoes.abrir', $n))
        ->assertRedirect('/doacoes');

    expect($n->fresh()->lida)->toBeTrue();
});

test('abrir sem destino leva para a lista de notificações', function () {
    $user = User::factory()->create(['tipo_usuario' => 'doador']);
    $n = notificacaoPara($user, ['url' => null]);

    $this->actingAs($user)
        ->get(route('notificacoes.abrir', $n))
        ->assertRedirect(route('notificacoes.index'));
});

test('marca uma notificação individualmente como lida', function () {
    $user = User::factory()->create(['tipo_usuario' => 'doador']);
    $alvo = notificacaoPara($user);
    $outra = notificacaoPara($user);

    $this->actingAs($user)
        ->patch(route('notificacoes.lida', $alvo))
        ->assertRedirect();

    expect($alvo->fresh()->lida)->toBeTrue()
        ->and($outra->fresh()->lida)->toBeFalse();
});

test('marca todas as notificações como lidas', function () {
    $user = User::factory()->create(['tipo_usuario' => 'doador']);
    notificacaoPara($user);
    notificacaoPara($user);

    $this->actingAs($user)
        ->post(route('notificacoes.lidas'))
        ->assertRedirect();

    expect(Notificacao::where('usuario_id', $user->id)->where('lida', false)->count())->toBe(0);
});

test('não acessa nem altera notificação de outro usuário', function () {
    $dono = User::factory()->create(['tipo_usuario' => 'doador']);
    $intruso = User::factory()->create(['tipo_usuario' => 'doador']);
    $n = notificacaoPara($dono);

    $this->actingAs($intruso)->get(route('notificacoes.abrir', $n))->assertForbidden();
    $this->actingAs($intruso)->patch(route('notificacoes.lida', $n))->assertForbidden();

    expect($n->fresh()->lida)->toBeFalse();
});

test('abrir a lista não marca nada como lido', function () {
    $user = User::factory()->create(['tipo_usuario' => 'doador']);
    $n = notificacaoPara($user);

    $this->actingAs($user)->get(route('notificacoes.index'))->assertOk();

    expect($n->fresh()->lida)->toBeFalse();
});

test('compartilha as não lidas mais recentes com o cabeçalho', function () {
    $user = User::factory()->create(['tipo_usuario' => 'doador']);
    notificacaoPara($user, ['titulo' => 'Nova']);
    notificacaoPara($user, ['titulo' => 'Antiga', 'lida' => true]);

    $this->actingAs($user)
        ->get(route('notificacoes.index'))
        ->assertInertia(fn ($page) => $page
            ->where('notificacoes_nao_lidas', 1)
            ->has('notificacoes_recentes', 1)
            ->where('notificacoes_recentes.0.titulo', 'Nova'));
});
