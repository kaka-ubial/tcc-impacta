<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get('/redirect');
    $response->assertRedirect(route('login'));
});

test('authenticated donors are redirected to the institutions list', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get('/redirect');
    $response->assertRedirect(route('instituicoes.index'));
});
