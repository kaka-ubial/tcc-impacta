<?php

use App\Models\CategoriaItem;
use App\Models\Causa;
use App\Models\ItemDoacao;
use Inertia\Testing\AssertableInertia as Assert;

test('doador não acessa o perfil de instituição', function () {
    $this->actingAs(criarDoadorUser())->get('/instituicao/perfil')->assertForbidden();
});

test('instituição vê o próprio perfil público em modo de edição', function () {
    $instituicao = criarInstituicaoComHorario();

    $this->actingAs($instituicao->usuario)
        ->get('/instituicao/perfil')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('instituicoes/show')
            ->where('isOwnProfile', true)
            ->where('canTransfer', false)
            ->where('instituicao.usuario_id', $instituicao->usuario_id)
            ->has('horariosEditaveis', 1)
            ->where('horariosEditaveis.0.pode_excluir', true)
            ->has('todasCausas'));
});

test('instituição edita descrição e causas pelo perfil', function () {
    $instituicao = criarInstituicaoComHorario();
    $causas = collect(['Educação', 'Saúde'])->map(fn ($nome) => Causa::create(['nome' => $nome]));

    $this->actingAs($instituicao->usuario)
        ->patch('/instituicao/perfil', ['descricao' => 'Atendemos 200 famílias.'])
        ->assertRedirect();

    $this->actingAs($instituicao->usuario)
        ->patch('/instituicao/perfil', ['causas' => $causas->pluck('id')->all()])
        ->assertRedirect();

    expect($instituicao->fresh()->descricao)->toBe('Atendemos 200 famílias.')
        ->and($instituicao->usuario->causas()->pluck('causas.id')->sort()->values()->all())
        ->toBe($causas->pluck('id')->sort()->values()->all());
});

test('salvar só as causas não apaga a descrição', function () {
    $instituicao = criarInstituicaoComHorario();
    $instituicao->update(['descricao' => 'Texto original']);

    $this->actingAs($instituicao->usuario)
        ->patch('/instituicao/perfil', ['causas' => []])
        ->assertRedirect();

    expect($instituicao->fresh()->descricao)->toBe('Texto original');
});

test('rejeita causa inexistente e descrição longa demais', function () {
    $instituicao = criarInstituicaoComHorario();

    $this->actingAs($instituicao->usuario)
        ->patch('/instituicao/perfil', [
            'descricao' => str_repeat('a', 2001),
            'causas' => [999999],
        ])
        ->assertSessionHasErrors(['descricao', 'causas.0']);
});

test('perfil público mostra horários e impacto só com doações entregues', function () {
    $instituicao = criarInstituicaoComHorario();
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Alimentos']);

    $entregue = criarDoacaoPendente($instituicao, 'entregue');
    ItemDoacao::create(['doacao_id' => $entregue->id, 'categoria_id' => $categoria->id, 'quantidade' => 5]);

    // Mesmo doador entregando de novo conta como 1 doador.
    $segunda = criarDoacaoPendente($instituicao, 'entregue');
    $segunda->update(['doador_id' => $entregue->doador_id]);
    ItemDoacao::create(['doacao_id' => $segunda->id, 'categoria_id' => $categoria->id, 'quantidade' => 2]);

    $pendente = criarDoacaoPendente($instituicao);
    ItemDoacao::create(['doacao_id' => $pendente->id, 'categoria_id' => $categoria->id, 'quantidade' => 50]);
    criarDoacaoPendente($instituicao, 'cancelado');

    $this->actingAs(criarDoadorUser())
        ->get("/instituicoes/{$instituicao->usuario_id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('instituicoes/show')
            ->has('instituicao.horarios_disponiveis', 1)
            ->where('instituicao.impacto', [
                'doacoes_entregues' => 2,
                'itens_recebidos' => 7,
                'doadores' => 1,
            ]));
});

test('API de detalhe expõe o mesmo impacto', function () {
    $instituicao = criarInstituicaoComHorario();
    criarDoacaoPendente($instituicao, 'entregue');

    $doador = criarDoadorUser();

    $this->actingAs($doador, 'sanctum')
        ->getJson("/api/instituicoes/{$instituicao->usuario_id}")
        ->assertOk()
        ->assertJsonPath('data.impacto.doacoes_entregues', 1)
        ->assertJsonPath('data.impacto.doadores', 1);
});
