<?php

use App\Models\Avaliacao;
use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\Doador;
use App\Models\Instituicao;
use App\Models\ItemDoacao;
use App\Models\User;
use App\Services\EstatisticasInstituicaoService;

function estatInstituicao(): Instituicao
{
    $user = User::factory()->create(['tipo_usuario' => 'instituicao']);

    return Instituicao::factory()->create(['usuario_id' => $user->id, 'status' => 'approved']);
}

function estatDoador(): Doador
{
    $user = User::factory()->create(['tipo_usuario' => 'doador']);

    return Doador::create([
        'usuario_id' => $user->id,
        'nome_completo' => 'Doador Teste',
        'cpf' => fake('pt_BR')->cpf(),
        'telefone' => '(41) 91234-5678',
        'endereco_completo' => 'Rua A, 1',
        'pontuacao_gamificacao' => 0,
        'latitude' => -25.4,
        'longitude' => -49.3,
    ]);
}

function estatDoacao(Doador $d, Instituicao $i, string $status, ?string $criadaEm = null, int $qtd = 3): Doacao
{
    $doacao = Doacao::create([
        'doador_id' => $d->usuario_id,
        'instituicao_id' => $i->usuario_id,
        'status' => $status,
    ]);
    if ($criadaEm) {
        $doacao->forceFill(['created_at' => $criadaEm])->saveQuietly();
    }
    ItemDoacao::create([
        'doacao_id' => $doacao->id,
        'categoria_id' => CategoriaItem::firstOrCreate(['nome' => 'Alimentos'])->id,
        'quantidade' => $qtd,
    ]);

    return $doacao;
}

test('visitantes e doadores não acessam as estatísticas', function () {
    $this->get('/instituicao/estatisticas')->assertRedirect(route('login'));

    $this->actingAs(estatDoador()->usuario)->get('/instituicao/estatisticas')->assertForbidden();
});

test('agrega doações, doadores de primeira vez e avaliações da instituição', function () {
    $inst = estatInstituicao();
    $outra = estatInstituicao();
    $antigo = estatDoador();
    $novo = estatDoador();

    estatDoacao($antigo, $inst, 'entregue', now()->subDays(200)->toDateTimeString());
    $recente = estatDoacao($antigo, $inst, 'entregue', now()->subDays(5)->toDateTimeString(), 4);
    estatDoacao($novo, $inst, 'entregue', now()->subDays(3)->toDateTimeString(), 2);
    estatDoacao($novo, $inst, 'cancelado');
    estatDoacao($novo, $inst, 'recusada');
    estatDoacao($novo, $inst, 'pendente');
    estatDoacao($novo, $outra, 'entregue'); // de outra instituição: não conta

    Avaliacao::create(['usuario_id' => $inst->usuario_id, 'doacao_id' => $recente->id, 'nota' => 4, 'descricao' => 'ok']);

    $this->actingAs($inst->usuario)
        ->get('/instituicao/estatisticas?periodo=90d')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('instituicao/estatisticas')
            ->where('estatisticas.doacoes.total', 5)
            ->where('estatisticas.doacoes.entregues', 2)
            ->where('estatisticas.doacoes.canceladas', 1)
            ->where('estatisticas.doacoes.recusadas', 1)
            ->where('estatisticas.doacoes.taxa_conclusao', 50)
            ->where('estatisticas.doadores.unicos', 2)
            ->where('estatisticas.doadores.primeira_vez', 1)
            ->where('estatisticas.doadores.recorrentes', 1)
            ->where('estatisticas.itens_por_categoria.0.quantidade', 6)
            ->where('estatisticas.avaliacoes.media', 4)
            ->where('estatisticas.avaliacoes.percentual_avaliadas', 50));
});

test('período inválido é rejeitado', function () {
    $inst = estatInstituicao();

    $this->actingAs($inst->usuario)
        ->get('/instituicao/estatisticas?periodo=banana')
        ->assertSessionHasErrors('periodo');
});

function layoutValido(): array
{
    return [
        'widgets' => [
            ['id' => 'transferencias', 'visivel' => true],
            ['id' => 'serie', 'visivel' => false],
            ['id' => 'indicadores', 'visivel' => true],
            ['id' => 'doadores', 'visivel' => true],
            ['id' => 'itens_categoria', 'visivel' => false],
            ['id' => 'avaliacoes', 'visivel' => true],
        ],
        'periodo' => '12m',
    ];
}

test('salva o layout das estatísticas sem apagar outras preferências', function () {
    $inst = estatInstituicao();
    $inst->usuario->forceFill(['preferencias' => ['outra_tela' => ['x' => 1]]])->save();

    $this->actingAs($inst->usuario)
        ->from('/instituicao/estatisticas')
        ->patch('/instituicao/estatisticas/layout', layoutValido())
        ->assertRedirect('/instituicao/estatisticas');

    $prefs = $inst->usuario->fresh()->preferencias;
    expect($prefs['outra_tela'])->toBe(['x' => 1])
        ->and($prefs['estatisticas'])->toBe(layoutValido());
});

test('layout com widget desconhecido, repetido ou período inválido é rejeitado', function (array $dados, string $erro) {
    $inst = estatInstituicao();

    $this->actingAs($inst->usuario)
        ->patch('/instituicao/estatisticas/layout', [...layoutValido(), ...$dados])
        ->assertSessionHasErrors($erro);

    expect($inst->usuario->fresh()->preferencias)->toBeNull();
})->with([
    'widget desconhecido' => [['widgets' => [['id' => 'banana', 'visivel' => true]]], 'widgets.0.id'],
    'widget repetido' => [['widgets' => [['id' => 'serie', 'visivel' => true], ['id' => 'serie', 'visivel' => false]]], 'widgets.0.id'],
    'período inválido' => [['periodo' => 'banana'], 'periodo'],
]);

test('doadores não salvam layout de estatísticas', function () {
    $this->actingAs(estatDoador()->usuario)
        ->patch('/instituicao/estatisticas/layout', layoutValido())
        ->assertForbidden();
});

test('sem layout salvo, todos os widgets aparecem na ordem padrão', function () {
    $inst = estatInstituicao();

    $this->actingAs($inst->usuario)
        ->get('/instituicao/estatisticas')
        ->assertInertia(fn ($page) => $page
            ->where('layout.periodo', '90d')
            ->where('estatisticas.periodo', '90d')
            ->where('layout.widgets', collect(EstatisticasInstituicaoService::WIDGETS)
                ->map(fn ($id) => ['id' => $id, 'visivel' => true])->all()));
});

test('layout salvo é normalizado e o período salvo vira o padrão', function () {
    $inst = estatInstituicao();
    // Layout antigo: sem o widget "avaliacoes" e com um id que não existe mais
    $inst->usuario->forceFill(['preferencias' => ['estatisticas' => [
        'widgets' => [
            ['id' => 'serie', 'visivel' => false],
            ['id' => 'removido', 'visivel' => true],
            ['id' => 'indicadores', 'visivel' => true],
            ['id' => 'doadores', 'visivel' => true],
            ['id' => 'itens_categoria', 'visivel' => true],
            ['id' => 'transferencias', 'visivel' => true],
        ],
        'periodo' => '30d',
    ]]])->save();

    $this->actingAs($inst->usuario)
        ->get('/instituicao/estatisticas')
        ->assertInertia(fn ($page) => $page
            ->where('estatisticas.periodo', '30d')
            ->where('layout.widgets.0', ['id' => 'serie', 'visivel' => false])
            ->where('layout.widgets.1.id', 'indicadores')
            ->where('layout.widgets.5', ['id' => 'avaliacoes', 'visivel' => true])
            ->count('layout.widgets', 6));

    // O período da URL tem prioridade sobre o salvo
    $this->actingAs($inst->usuario)
        ->get('/instituicao/estatisticas?periodo=todo')
        ->assertInertia(fn ($page) => $page->where('estatisticas.periodo', 'todo'));
});
