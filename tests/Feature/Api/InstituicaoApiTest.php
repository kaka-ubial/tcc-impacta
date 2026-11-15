<?php

use App\Enums\InstituicaoStatus;
use App\Enums\TransferenciaStatus;
use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\HorarioDisponivel;
use App\Models\Necessidade;
use App\Models\Transferencia;

function tokenDe($instituicao): string
{
    return $instituicao->usuario->createToken('t')->plainTextToken;
}

function criarTransferencia(
    $origem,
    $destino,
    string $status = 'pendente',
    ?CategoriaItem $categoria = null,
    ?Necessidade $necessidade = null,
    int $quantidade = 2,
): Transferencia {
    $categoria ??= CategoriaItem::firstOrCreate(['nome' => 'Roupas']);

    $t = Transferencia::create([
        'instituicao_origem_id' => $origem->usuario_id,
        'instituicao_destino_id' => $destino->usuario_id,
        'status' => $status,
        'data_hora' => now()->addDays(3),
        'tipo' => 'entrega',
    ]);
    $t->itens()->create([
        'categoria_id' => $categoria->id,
        'necessidade_id' => $necessidade?->id,
        'quantidade' => $quantidade,
    ]);

    return $t;
}

// ---------------------------------------------------------------- horários

test('instituição gerencia horários pela API', function () {
    $inst = criarInstituicaoComHorario();
    $token = tokenDe($inst);

    $this->getJson('/api/horarios', bearer($token))->assertOk()->assertJsonCount(1, 'data');

    $resp = $this->postJson('/api/horarios', [
        'dia_semana' => 2,
        'hora_inicio' => '09:00',
        'hora_fim' => '11:00',
        'tipo' => 'entrega',
    ], bearer($token));
    $resp->assertCreated();

    $this->deleteJson('/api/horarios/'.$resp->json('data.id'), [], bearer($token))->assertNoContent();
});

test('instituição pendente não acessa rotas protegidas da API', function () {
    $inst = criarInstituicaoComHorario();
    $inst->update(['status' => InstituicaoStatus::Pending]);
    $this->getJson('/api/horarios', bearer(tokenDe($inst)))->assertForbidden();

    $inst->update(['status' => InstituicaoStatus::Rejected]);
    $this->getJson('/api/horarios', bearer(tokenDe($inst)))->assertForbidden();
});

// ------------------------------------------------------------ necessidades

test('instituição gerencia necessidades pela API', function () {
    $inst = criarInstituicaoComHorario();
    $token = tokenDe($inst);
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Alimentos']);
    $payload = [
        'categoria_id' => $categoria->id,
        'descricao' => 'Cestas básicas',
        'quantidade_objetivo' => 20,
        'prioridade' => 'alta',
    ];

    $resp = $this->postJson('/api/necessidades', $payload, bearer($token));
    $resp->assertCreated();
    $id = $resp->json('data.id');

    $this->getJson('/api/necessidades', bearer($token))->assertOk()->assertJsonCount(1, 'data');

    $this->putJson("/api/necessidades/{$id}", [...$payload, 'quantidade_objetivo' => 50], bearer($token))->assertOk();
    expect(Necessidade::find($id)->quantidade_objetivo)->toBe(50);

    $this->postJson('/api/necessidades', [], bearer($token))->assertUnprocessable();

    $this->deleteJson("/api/necessidades/{$id}", [], bearer($token))->assertNoContent();
    expect(Necessidade::find($id))->toBeNull();
});

test('instituição sem horários não cria necessidade e não mexe na de outra', function () {
    $inst = criarInstituicaoComHorario();
    $outra = criarInstituicaoComHorario();
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Alimentos']);
    $alheia = Necessidade::create([
        'instituicao_id' => $outra->usuario_id,
        'categoria_id' => $categoria->id,
        'descricao' => 'Leite em pó',
        'quantidade_objetivo' => 5,
        'quantidade_atual' => 0,
        'prioridade' => 'baixa',
    ]);
    $token = tokenDe($inst);

    $this->deleteJson("/api/necessidades/{$alheia->id}", [], bearer($token))->assertForbidden();

    HorarioDisponivel::where('instituicao_id', $inst->usuario_id)->delete();
    $this->postJson('/api/necessidades', [
        'categoria_id' => $categoria->id,
        'descricao' => 'Cestas básicas',
        'quantidade_objetivo' => 20,
        'prioridade' => 'alta',
    ], bearer($token))->assertStatus(422);
});

// ------------------------------------------------------------------ agenda

test('instituição vê a agenda e sugere nova data', function () {
    $inst = criarInstituicaoComHorario();
    $token = tokenDe($inst);
    $ag = criarAgendamento($inst, criarDoadorUser());
    $destino = criarInstituicaoComHorario();
    criarTransferencia($inst, $destino);

    $this->getJson('/api/agenda', bearer($token))
        ->assertOk()
        ->assertJsonStructure(['agendamentos', 'horarios', 'transferencias']);

    $this->postJson("/api/agendamentos/{$ag->id}/sugerir", [
        'data_hora_sugerida' => now()->addDays(7)->toDateTimeString(),
    ], bearer($token))->assertOk();
    expect($ag->fresh()->status->value)->toBe('alteracao_sugerida');

    $this->postJson("/api/agendamentos/{$ag->id}/sugerir", [], bearer($token))->assertUnprocessable();

    $outro = criarAgendamento(criarInstituicaoComHorario(), criarDoadorUser());
    $this->postJson("/api/agendamentos/{$outro->id}/sugerir", [
        'data_hora_sugerida' => now()->addDays(7)->toDateTimeString(),
    ], bearer($token))->assertForbidden();
});

// ----------------------------------------------------------------- doadores

test('instituição vê o perfil de doador que doou a ela e não de outros', function () {
    $inst = criarInstituicaoComHorario();
    $token = tokenDe($inst);
    $doacao = criarDoacaoPendente($inst);
    $outro = criarDoadorUser();

    $this->getJson("/api/instituicao/doadores/{$doacao->doador_id}", bearer($token))->assertOk();
    $this->getJson("/api/instituicao/doadores/{$outro->doador->usuario_id}", bearer($token))->assertForbidden();
});

// ------------------------------------------------------------ transferências

test('instituição cria transferência com estoque e lista', function () {
    $origem = criarInstituicaoComHorario();
    $destino = criarInstituicaoComHorario();
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);
    darEstoque($origem, $categoria, 10);
    $token = tokenDe($origem);

    $payload = [
        'instituicao_destino_id' => $destino->usuario_id,
        'itens' => [['categoria_id' => $categoria->id, 'quantidade' => 4]],
        'agendamento' => ['tipo' => 'entrega', 'data_hora' => now()->addDays(2)->toDateTimeString()],
    ];

    $this->postJson('/api/transferencias', $payload, bearer($token))->assertCreated();
    $this->getJson('/api/transferencias', bearer($token))->assertOk()->assertJsonCount(1, 'data');

    // Estoque restante é 6 => pedir 7 falha
    $payload['itens'][0]['quantidade'] = 7;
    $this->postJson('/api/transferencias', $payload, bearer($token))->assertStatus(422);

    // Transferir para si mesma falha
    $payload['instituicao_destino_id'] = $origem->usuario_id;
    $payload['itens'][0]['quantidade'] = 1;
    $this->postJson('/api/transferencias', $payload, bearer($token))->assertStatus(422);
});

test('destino confirma, entrega e marca transferência como não entregue', function () {
    $origem = criarInstituicaoComHorario();
    $destino = criarInstituicaoComHorario();
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);
    $necessidade = Necessidade::create([
        'instituicao_id' => $destino->usuario_id,
        'categoria_id' => $categoria->id,
        'descricao' => 'Roupas',
        'quantidade_objetivo' => 10,
        'quantidade_atual' => 0,
        'prioridade' => 'alta',
    ]);
    $token = tokenDe($destino);

    $t = criarTransferencia($origem, $destino, 'pendente', $categoria, $necessidade, 3);
    $this->postJson("/api/transferencias/{$t->id}/confirmar", [], bearer($token))->assertOk();
    expect($necessidade->fresh()->quantidade_atual)->toBe(3);
    $this->postJson("/api/transferencias/{$t->id}/entregar", [], bearer($token))->assertOk();
    expect($t->fresh()->status)->toBe(TransferenciaStatus::Entregue);

    $t2 = criarTransferencia($origem, $destino, 'confirmada', $categoria, $necessidade, 3);
    $this->postJson("/api/transferencias/{$t2->id}/nao-entregue", [], bearer($token))->assertOk();
    expect($necessidade->fresh()->quantidade_atual)->toBe(0);

    $t3 = criarTransferencia($origem, $destino);
    $this->postJson("/api/transferencias/{$t3->id}/recusar", [], bearer($token))->assertOk();
    expect($t3->fresh()->status)->toBe(TransferenciaStatus::Recusada);

    // Estados inválidos => 422
    $this->postJson("/api/transferencias/{$t3->id}/confirmar", [], bearer($token))->assertStatus(422);
    $this->postJson("/api/transferencias/{$t3->id}/entregar", [], bearer($token))->assertStatus(422);
    $this->postJson("/api/transferencias/{$t3->id}/nao-entregue", [], bearer($token))->assertStatus(422);
    $this->postJson("/api/transferencias/{$t3->id}/recusar", [], bearer($token))->assertStatus(422);
});

test('origem não opera ações do destino e vice-versa', function () {
    $origem = criarInstituicaoComHorario();
    $destino = criarInstituicaoComHorario();
    $t = criarTransferencia($origem, $destino);
    $tokenOrigem = tokenDe($origem);
    $tokenDestino = tokenDe($destino);

    foreach (['confirmar', 'recusar', 'entregar', 'nao-entregue'] as $acao) {
        $this->postJson("/api/transferencias/{$t->id}/{$acao}", [], bearer($tokenOrigem))->assertForbidden();
    }
    foreach (['cancelar', 'sugestao/aceitar', 'sugestao/recusar'] as $acao) {
        $this->postJson("/api/transferencias/{$t->id}/{$acao}", [], bearer($tokenDestino))->assertForbidden();
    }
    $outra = criarInstituicaoComHorario();
    $this->postJson("/api/transferencias/{$t->id}/sugerir", [
        'data_hora_sugerida' => now()->addDays(4)->toDateTimeString(),
    ], bearer(tokenDe($outra)))->assertForbidden();
});

test('destino sugere nova data e origem aceita ou recusa', function () {
    $origem = criarInstituicaoComHorario();
    $destino = criarInstituicaoComHorario();
    $t = criarTransferencia($origem, $destino);
    $sugerida = now()->addDays(6)->startOfMinute();

    $this->postJson("/api/transferencias/{$t->id}/sugerir", [
        'data_hora_sugerida' => $sugerida->toDateTimeString(),
    ], bearer(tokenDe($destino)))->assertOk();
    expect($t->fresh()->status)->toBe(TransferenciaStatus::AlteracaoSugerida);

    $this->postJson("/api/transferencias/{$t->id}/sugestao/aceitar", [], bearer(tokenDe($origem)))->assertOk();
    expect($t->fresh()->status)->toBe(TransferenciaStatus::Pendente);
    expect($t->fresh()->data_hora->equalTo($sugerida))->toBeTrue();

    $this->postJson("/api/transferencias/{$t->id}/sugerir", [
        'data_hora_sugerida' => $sugerida->copy()->addDay()->toDateTimeString(),
    ], bearer(tokenDe($destino)))->assertOk();
    $this->postJson("/api/transferencias/{$t->id}/sugestao/recusar", [], bearer(tokenDe($origem)))->assertOk();
    expect($t->fresh()->status)->toBe(TransferenciaStatus::Pendente);
    expect($t->fresh()->data_hora_sugerida)->toBeNull();

    // Sem sugestão pendente => 422
    $this->postJson("/api/transferencias/{$t->id}/sugestao/aceitar", [], bearer(tokenDe($origem)))->assertStatus(422);
    $this->postJson("/api/transferencias/{$t->id}/sugestao/recusar", [], bearer(tokenDe($origem)))->assertStatus(422);
});

test('origem cancela transferência pendente apenas', function () {
    $origem = criarInstituicaoComHorario();
    $destino = criarInstituicaoComHorario();
    $t = criarTransferencia($origem, $destino);
    $token = tokenDe($origem);

    $this->postJson("/api/transferencias/{$t->id}/cancelar", [], bearer($token))->assertOk();
    expect($t->fresh()->status)->toBe(TransferenciaStatus::Cancelada);
    $this->postJson("/api/transferencias/{$t->id}/cancelar", [], bearer($token))->assertStatus(422);
});

// ------------------------------------------------------------ instituições

test('doador lista, recomenda e consulta instituições pela API', function () {
    $inst = criarInstituicaoComHorario();
    $token = criarDoadorUser()->createToken('t')->plainTextToken;

    $this->getJson('/api/instituicoes', bearer($token))->assertOk();
    $this->getJson('/api/instituicoes/recomendadas', bearer($token))->assertOk();
    $this->getJson("/api/instituicoes/{$inst->usuario_id}", bearer($token))->assertOk();
    $this->getJson('/api/instituicoes/999999', bearer($token))->assertNotFound();
});

// -------------------------------------------------------------------- admin

test('admin lista, aprova e rejeita instituições pela API', function () {
    $admin = criarAdminUser();
    $token = $admin->createToken('t')->plainTextToken;
    $pendente = criarInstituicaoComHorario();
    $pendente->update(['status' => InstituicaoStatus::Pending]);
    $outra = criarInstituicaoComHorario();
    $outra->update(['status' => InstituicaoStatus::Pending]);

    $this->getJson('/api/admin/institutions', bearer($token))->assertOk()->assertJsonCount(2, 'data');

    $this->postJson("/api/admin/institutions/{$pendente->usuario_id}/approve", [], bearer($token))->assertOk();
    expect($pendente->fresh()->status)->toBe(InstituicaoStatus::Approved);

    $this->postJson("/api/admin/institutions/{$outra->usuario_id}/reject", [], bearer($token))->assertUnprocessable();
    $this->postJson("/api/admin/institutions/{$outra->usuario_id}/reject", [
        'motivo' => 'Documentação inválida ou incompleta',
    ], bearer($token))->assertOk();
    expect($outra->fresh()->status)->toBe(InstituicaoStatus::Rejected);
});

test('admin consulta e edita usuários pela API', function () {
    $admin = criarAdminUser();
    $token = $admin->createToken('t')->plainTextToken;
    $doador = criarDoadorUser();
    $inst = criarInstituicaoComHorario();

    $this->getJson("/api/admin/users/{$doador->id}", bearer($token))->assertOk();
    $this->getJson("/api/admin/users/{$inst->usuario_id}", bearer($token))->assertOk();

    $this->putJson("/api/admin/doadores/{$doador->id}", [], bearer($token))->assertUnprocessable();
    $this->putJson("/api/admin/instituicoes/{$inst->usuario_id}", [], bearer($token))->assertUnprocessable();
});

test('doação em outra instituição não aparece na lista', function () {
    $inst = criarInstituicaoComHorario();
    criarDoacaoPendente(criarInstituicaoComHorario());

    $this->getJson('/api/instituicao/doacoes', bearer(tokenDe($inst)))->assertOk()->assertJsonCount(0, 'data');
    expect(Doacao::count())->toBe(1);
});
