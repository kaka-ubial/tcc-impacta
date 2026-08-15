<?php

use App\Models\Doador;
use App\Models\User;

function makeDoadorFor(User $user): Doador
{
    return Doador::create([
        'usuario_id'            => $user->id,
        'nome_completo'         => 'Doador Original',
        'cpf'                   => '529.982.247-25',
        'telefone'              => '(11) 91234-5678',
        'pontuacao_gamificacao' => 0,
    ]);
}

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();
    makeDoadorFor($user);

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'tipo_usuario'  => 'doador',
            'email'         => 'test@example.com',
            'nome_completo' => 'Test User',
            'cpf'           => '529.982.247-25',
            'telefone'      => '(11) 91234-5678',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->doador->nome_completo)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();
    makeDoadorFor($user);

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'tipo_usuario'  => 'doador',
            'email'         => $user->email,
            'nome_completo' => 'Test User',
            'cpf'           => '529.982.247-25',
            'telefone'      => '(11) 91234-5678',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});