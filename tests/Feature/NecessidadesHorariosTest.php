<?php

use App\Models\HorarioDisponivel;

test('a página de necessidades traz os horários da instituição', function () {
    $instituicao = criarInstituicaoComHorario();
    HorarioDisponivel::create([
        'instituicao_id' => $instituicao->usuario_id,
        'dia_semana' => 3,
        'hora_inicio' => '14:00',
        'hora_fim' => '17:00',
        'tipo' => 'entrega',
        'ativo' => true,
    ]);

    $this->actingAs($instituicao->usuario)
        ->get(route('instituicao.necessidades.index'))
        ->assertInertia(fn ($page) => $page
            ->component('instituicao/necessidades')
            ->where('tem_horarios', true)
            ->has('horarios', 2)
            ->where('horarios.0.pode_excluir', true));
});

test('adicionar horário pelo modal volta para a mesma página', function () {
    $instituicao = criarInstituicaoComHorario();

    $this->actingAs($instituicao->usuario)
        ->from(route('instituicao.necessidades.index'))
        ->post(route('instituicao.horarios.store'), [
            'dia_semana' => 2,
            'hora_inicio' => '09:00',
            'hora_fim' => '11:00',
            'tipo' => 'coleta',
        ])
        ->assertRedirect(route('instituicao.necessidades.index'));

    expect(HorarioDisponivel::where('instituicao_id', $instituicao->usuario_id)->count())->toBe(2);
});
