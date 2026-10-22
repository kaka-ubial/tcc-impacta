<?php

use App\Models\Instituicao;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function perfilInstituicao(): User
{
    $user = User::factory()->create(['tipo_usuario' => 'instituicao']);
    Instituicao::factory()->create(['usuario_id' => $user->id, 'status' => 'approved']);

    return $user;
}

test('instituicao ve o proprio perfil', function () {
    $user = perfilInstituicao();

    $this->actingAs($user)
        ->get(route('instituicao.perfil'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('instituicao/perfil')
            ->where('instituicao.usuario_id', $user->id)
            ->where('instituicao.email', $user->email)
            ->has('instituicao.estatisticas'));
});

test('doador nao acessa o perfil da instituicao', function () {
    $user = User::factory()->create(['tipo_usuario' => 'doador']);

    $this->actingAs($user)->get(route('instituicao.perfil'))->assertForbidden();
});

test('api devolve o perfil da instituicao autenticada', function () {
    $user = perfilInstituicao();

    $this->actingAs($user, 'sanctum')
        ->getJson(route('api.instituicao.perfil'))
        ->assertOk()
        ->assertJsonPath('data.usuario_id', $user->id);
});

test('instituicao envia e remove o logo', function () {
    Storage::fake('public');
    $user = perfilInstituicao();

    $this->actingAs($user)
        ->post(route('profile.foto.update'), ['foto' => UploadedFile::fake()->image('logo.png')])
        ->assertSessionHasNoErrors();

    $path = $user->instituicao->fresh()->foto_perfil;
    expect($path)->not->toBeNull();
    Storage::disk('public')->assertExists($path);

    $this->actingAs($user)->delete(route('profile.foto.destroy'));

    expect($user->instituicao->fresh()->foto_perfil)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});
