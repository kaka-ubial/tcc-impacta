<?php

use App\Models\HorarioDisponivel;
use App\Models\Instituicao;
use App\Models\User;

function instituicaoComStatus(string $status): Instituicao
{
    $user = User::factory()->instituicao()->create(['status' => 'ativo']);

    return Instituicao::factory()->create([
        'usuario_id' => $user->id,
        'status' => $status,
    ]);
}

function payloadHorario(array $override = []): array
{
    return array_merge([
        'dia_semana' => 2,
        'hora_inicio' => '09:00',
        'hora_fim' => '12:00',
        'tipo' => 'entrega',
    ], $override);
}

test('instituicao pendente vê a tela de espera com seus horários', function () {
    $instituicao = instituicaoComStatus('pending');
    HorarioDisponivel::create(array_merge(payloadHorario(), [
        'instituicao_id' => $instituicao->usuario_id,
        'ativo' => true,
    ]));

    $this->actingAs($instituicao->usuario)
        ->get(route('waiting-validation'))
        ->assertInertia(fn ($page) => $page
            ->component('auth/waiting-approval')
            ->where('nomeFantasia', $instituicao->nome_fantasia)
            ->has('horarios', 1));
});

test('instituicao pendente cadastra e remove horário na tela de espera', function () {
    $instituicao = instituicaoComStatus('pending');
    $this->actingAs($instituicao->usuario);

    $this->post(route('waiting-validation.horarios.store'), payloadHorario())
        ->assertRedirect();

    $horario = HorarioDisponivel::where('instituicao_id', $instituicao->usuario_id)->sole();

    $this->delete(route('waiting-validation.horarios.destroy', $horario))
        ->assertRedirect();

    expect(HorarioDisponivel::where('instituicao_id', $instituicao->usuario_id)->exists())->toBeFalse();
});

test('horário com fim antes do início é recusado', function () {
    $instituicao = instituicaoComStatus('pending');

    $this->actingAs($instituicao->usuario)
        ->post(route('waiting-validation.horarios.store'), payloadHorario(['hora_fim' => '08:00']))
        ->assertSessionHasErrors('hora_fim');
});

test('instituicao rejeitada não cadastra horário pela tela de espera', function () {
    $instituicao = instituicaoComStatus('rejected');

    $this->actingAs($instituicao->usuario)
        ->post(route('waiting-validation.horarios.store'), payloadHorario())
        ->assertForbidden();
});

test('instituicao pendente não remove horário de outra instituicao', function () {
    $pendente = instituicaoComStatus('pending');
    $outra = instituicaoComStatus('approved');
    $horario = HorarioDisponivel::create(array_merge(payloadHorario(), [
        'instituicao_id' => $outra->usuario_id,
        'ativo' => true,
    ]));

    $this->actingAs($pendente->usuario)
        ->delete(route('waiting-validation.horarios.destroy', $horario))
        ->assertForbidden();

    expect($horario->fresh())->not->toBeNull();
});

test('instituicao aprovada é enviada ao painel', function () {
    $instituicao = instituicaoComStatus('approved');

    $this->actingAs($instituicao->usuario)
        ->get(route('waiting-validation'))
        ->assertRedirect(route('instituicao.painel'));
});

test('doador não acessa a tela de espera', function () {
    $this->actingAs(User::factory()->create(['tipo_usuario' => 'doador']))
        ->get(route('waiting-validation'))
        ->assertForbidden();
});

test('instituicao rejeitada é enviada à tela de rejeição', function () {
    $instituicao = instituicaoComStatus('rejected');

    $this->actingAs($instituicao->usuario)
        ->get(route('waiting-validation'))
        ->assertRedirect(route('rejected'));
});

test('instituicao pendente vê a ficha de cadastro', function () {
    $instituicao = instituicaoComStatus('pending');

    $this->actingAs($instituicao->usuario)
        ->get(route('waiting-validation.ficha'))
        ->assertInertia(fn ($page) => $page
            ->component('auth/registration-summary')
            ->where('ficha.cnpj', $instituicao->cnpj)
            ->where('ficha.email', $instituicao->usuario->email)
            ->has('horarios'));
});

test('ficha de cadastro redireciona aprovada e rejeitada', function () {
    $aprovada = instituicaoComStatus('approved');
    $this->actingAs($aprovada->usuario)
        ->get(route('waiting-validation.ficha'))
        ->assertRedirect(route('instituicao.painel'));

    $rejeitada = instituicaoComStatus('rejected');
    $this->actingAs($rejeitada->usuario)
        ->get(route('waiting-validation.ficha'))
        ->assertRedirect(route('rejected'));
});
