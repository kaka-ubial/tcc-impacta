<?php

use App\Enums\AgendamentoStatus;
use App\Models\Avaliacao;
use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\ItemDoacao;
use App\Models\Necessidade;

function payloadDoacao(int $instituicaoId, int $categoriaId, ?int $necessidadeId = null): array
{
    return [
        'instituicao_id' => $instituicaoId,
        'itens' => [[
            'categoria_id' => $categoriaId,
            'necessidade_id' => $necessidadeId,
            'quantidade' => 3,
            'descricao' => 'Camisetas',
        ]],
        'agendamento' => [
            'tipo' => 'coleta',
            'data_hora' => now()->addDays(2)->toDateTimeString(),
            'endereco_referencia' => 'Rua A, 10',
        ],
    ];
}

test('doador cria, lista e cancela uma doação pela API', function () {
    $instituicao = criarInstituicaoComHorario();
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);
    $doador = criarDoadorUser();
    $token = $doador->createToken('t')->plainTextToken;

    $resp = $this->postJson('/api/doacoes', payloadDoacao($instituicao->usuario_id, $categoria->id), bearer($token));
    $resp->assertCreated();
    $id = $resp->json('data.id');

    $this->getJson('/api/doacoes', bearer($token))->assertOk()->assertJsonCount(1, 'data');

    $this->postJson("/api/doacoes/{$id}/cancel", [], bearer($token))->assertNoContent();
    expect(Doacao::find($id)->status->value)->toBe('cancelado');
});

test('doador não cria doação para instituição sem horários', function () {
    $instituicao = criarInstituicaoComHorario();
    $instituicao->horarios()->delete();
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);
    $token = criarDoadorUser()->createToken('t')->plainTextToken;

    $this->postJson('/api/doacoes', payloadDoacao($instituicao->usuario_id, $categoria->id), bearer($token))
        ->assertStatus(422);
});

test('doador valida o payload da doação', function () {
    $token = criarDoadorUser()->createToken('t')->plainTextToken;

    $this->postJson('/api/doacoes', [], bearer($token))->assertUnprocessable();
});

test('doador não cancela doação de outro doador', function () {
    $instituicao = criarInstituicaoComHorario();
    $doacao = criarDoacaoPendente($instituicao);
    $token = criarDoadorUser()->createToken('t')->plainTextToken;

    $this->postJson("/api/doacoes/{$doacao->id}/cancel", [], bearer($token))->assertForbidden();
});

test('doador aceita e recusa sugestão de nova data', function () {
    $instituicao = criarInstituicaoComHorario();
    $doadorUser = criarDoadorUser();
    $token = $doadorUser->createToken('t')->plainTextToken;
    $sugerida = now()->addDays(5)->toDateTimeString();

    $ag = criarAgendamento($instituicao, $doadorUser, 'alteracao_sugerida', $sugerida);
    $this->postJson("/api/doacoes/{$ag->doacao_id}/sugestao/aceitar", [], bearer($token))->assertNoContent();
    expect($ag->fresh()->status)->toBe(AgendamentoStatus::Confirmado);
    expect($ag->fresh()->data_hora_sugerida)->toBeNull();

    $ag2 = criarAgendamento($instituicao, $doadorUser, 'alteracao_sugerida', $sugerida);
    $this->postJson("/api/doacoes/{$ag2->doacao_id}/sugestao/recusar", [], bearer($token))->assertNoContent();
    expect($ag2->fresh()->status)->toBe(AgendamentoStatus::Confirmado);

    // Sem sugestão pendente => 422
    $this->postJson("/api/doacoes/{$ag2->doacao_id}/sugestao/aceitar", [], bearer($token))->assertStatus(422);
    $this->postJson("/api/doacoes/{$ag2->doacao_id}/sugestao/recusar", [], bearer($token))->assertStatus(422);
});

test('doador vê o próprio perfil e instituição não', function () {
    $doador = criarDoadorUser();
    $this->getJson('/api/perfil', bearer($doador->createToken('t')->plainTextToken))
        ->assertOk();

    $inst = criarInstituicaoComHorario();
    $this->getJson('/api/perfil', bearer($inst->usuario->createToken('t')->plainTextToken))
        ->assertForbidden();
});

test('instituição percorre o ciclo confirmar -> entregar e avalia', function () {
    $instituicao = criarInstituicaoComHorario();
    $token = $instituicao->usuario->createToken('t')->plainTextToken;
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);
    $necessidade = Necessidade::create([
        'instituicao_id' => $instituicao->usuario_id,
        'categoria_id' => $categoria->id,
        'descricao' => 'Roupas de inverno',
        'quantidade_objetivo' => 10,
        'quantidade_atual' => 0,
        'prioridade' => 'alta',
    ]);

    $doacao = criarDoacaoPendente($instituicao);
    ItemDoacao::create([
        'doacao_id' => $doacao->id,
        'necessidade_id' => $necessidade->id,
        'categoria_id' => $categoria->id,
        'quantidade' => 4,
    ]);

    $this->getJson('/api/instituicao/doacoes', bearer($token))->assertOk()->assertJsonCount(1, 'data');

    $this->postJson("/api/instituicao/doacoes/{$doacao->id}/confirm", [], bearer($token))->assertOk();
    expect($necessidade->fresh()->quantidade_atual)->toBe(4);

    $this->postJson("/api/instituicao/doacoes/{$doacao->id}/deliver", [], bearer($token))->assertOk();
    expect($doacao->fresh()->status->value)->toBe('entregue');

    $this->postJson("/api/instituicao/doacoes/{$doacao->id}/avaliar", ['nota' => 5, 'descricao' => 'Ótimo'], bearer($token))
        ->assertSuccessful();
    expect(Avaliacao::where('doacao_id', $doacao->id)->count())->toBe(1);

    // Avaliar duas vezes => 422; nota inválida => 422
    $this->postJson("/api/instituicao/doacoes/{$doacao->id}/avaliar", ['nota' => 5, 'descricao' => 'x'], bearer($token))
        ->assertStatus(422);
    $this->postJson("/api/instituicao/doacoes/{$doacao->id}/avaliar", ['nota' => 9], bearer($token))
        ->assertUnprocessable();
});

test('instituição recusa e marca doação como não entregue', function () {
    $instituicao = criarInstituicaoComHorario();
    $token = $instituicao->usuario->createToken('t')->plainTextToken;
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);
    $necessidade = Necessidade::create([
        'instituicao_id' => $instituicao->usuario_id,
        'categoria_id' => $categoria->id,
        'descricao' => 'Roupas de inverno',
        'quantidade_objetivo' => 10,
        'quantidade_atual' => 5,
        'prioridade' => 'baixa',
    ]);

    $rejeitada = criarDoacaoPendente($instituicao);
    $this->postJson("/api/instituicao/doacoes/{$rejeitada->id}/reject", [], bearer($token))->assertOk();
    expect($rejeitada->fresh()->status->value)->toBe('recusada');

    $confirmada = criarDoacaoPendente($instituicao, 'confirmada');
    ItemDoacao::create([
        'doacao_id' => $confirmada->id,
        'necessidade_id' => $necessidade->id,
        'categoria_id' => $categoria->id,
        'quantidade' => 2,
    ]);
    $this->postJson("/api/instituicao/doacoes/{$confirmada->id}/notDelivered", [], bearer($token))->assertOk();
    expect($necessidade->fresh()->quantidade_atual)->toBe(3);

    // Transição inválida e doação de outra instituição
    $this->postJson("/api/instituicao/doacoes/{$confirmada->id}/confirm", [], bearer($token))->assertStatus(422);
    $outra = criarDoacaoPendente(criarInstituicaoComHorario());
    $this->postJson("/api/instituicao/doacoes/{$outra->id}/confirm", [], bearer($token))->assertForbidden();
    $this->postJson("/api/instituicao/doacoes/{$outra->id}/reject", [], bearer($token))->assertForbidden();
    $this->postJson("/api/instituicao/doacoes/{$outra->id}/deliver", [], bearer($token))->assertForbidden();
    $this->postJson("/api/instituicao/doacoes/{$outra->id}/notDelivered", [], bearer($token))->assertForbidden();
});

test('cancelar doação confirmada devolve a quantidade da necessidade', function () {
    $instituicao = criarInstituicaoComHorario();
    $doadorUser = criarDoadorUser();
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);
    $necessidade = Necessidade::create([
        'instituicao_id' => $instituicao->usuario_id,
        'categoria_id' => $categoria->id,
        'descricao' => 'Roupas de inverno',
        'quantidade_objetivo' => 10,
        'quantidade_atual' => 5,
        'prioridade' => 'media',
    ]);
    $doacao = Doacao::create([
        'doador_id' => $doadorUser->doador->usuario_id,
        'instituicao_id' => $instituicao->usuario_id,
        'status' => 'confirmada',
    ]);
    ItemDoacao::create([
        'doacao_id' => $doacao->id,
        'necessidade_id' => $necessidade->id,
        'categoria_id' => $categoria->id,
        'quantidade' => 2,
    ]);

    $this->postJson("/api/doacoes/{$doacao->id}/cancel", [], bearer($doadorUser->createToken('t')->plainTextToken))
        ->assertNoContent();
    expect($necessidade->fresh()->quantidade_atual)->toBe(3);
});
