<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => Storage::fake('public'));

test('instituição envia logo e ele aparece no perfil e na listagem', function () {
    $instituicao = criarInstituicaoComHorario();

    $this->actingAs($instituicao->usuario)
        ->post('/settings/profile/foto', ['foto' => UploadedFile::fake()->image('logo.png', 200, 200)])
        ->assertRedirect();

    $path = $instituicao->fresh()->foto_perfil;
    expect($path)->toStartWith('logos/');
    Storage::disk('public')->assertExists($path);

    $doador = criarDoadorUser();

    $this->actingAs($doador)
        ->get("/instituicoes/{$instituicao->usuario_id}")
        ->assertInertia(fn (Assert $page) => $page->where('instituicao.foto_perfil', $path));

    $this->actingAs($doador)
        ->get('/instituicoes')
        ->assertInertia(fn (Assert $page) => $page->where('instituicoes.data.0.foto_perfil', $path));
});

test('trocar o logo apaga o arquivo anterior', function () {
    $instituicao = criarInstituicaoComHorario();

    $this->actingAs($instituicao->usuario)
        ->post('/settings/profile/foto', ['foto' => UploadedFile::fake()->image('a.png')]);
    $antigo = $instituicao->fresh()->foto_perfil;

    $this->actingAs($instituicao->usuario)
        ->post('/settings/profile/foto', ['foto' => UploadedFile::fake()->image('b.png')]);

    Storage::disk('public')->assertMissing($antigo);
    Storage::disk('public')->assertExists($instituicao->fresh()->foto_perfil);
});

test('instituição remove o logo', function () {
    $instituicao = criarInstituicaoComHorario();

    $this->actingAs($instituicao->usuario)
        ->post('/settings/profile/foto', ['foto' => UploadedFile::fake()->image('logo.png')]);
    $path = $instituicao->fresh()->foto_perfil;

    $this->actingAs($instituicao->usuario)
        ->delete('/settings/profile/foto')
        ->assertRedirect();

    expect($instituicao->fresh()->foto_perfil)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

test('doador continua enviando foto de perfil em avatars/', function () {
    $doador = criarDoadorUser();

    $this->actingAs($doador)
        ->post('/settings/profile/foto', ['foto' => UploadedFile::fake()->image('eu.jpg')])
        ->assertRedirect();

    expect($doador->doador->fresh()->foto_perfil)->toStartWith('avatars/');
});

test('rejeita arquivo que não é imagem ou maior que 2 MB', function () {
    $instituicao = criarInstituicaoComHorario();

    $this->actingAs($instituicao->usuario)
        ->post('/settings/profile/foto', ['foto' => UploadedFile::fake()->create('logo.pdf', 100, 'application/pdf')])
        ->assertSessionHasErrors('foto');

    $this->actingAs($instituicao->usuario)
        ->post('/settings/profile/foto', ['foto' => UploadedFile::fake()->image('grande.png')->size(3000)])
        ->assertSessionHasErrors('foto');

    expect($instituicao->fresh()->foto_perfil)->toBeNull();
});

test('admin não tem foto de perfil', function () {
    $this->actingAs(criarAdminUser())
        ->post('/settings/profile/foto', ['foto' => UploadedFile::fake()->image('x.png')])
        ->assertForbidden();
});
