<?php

use App\Models\Avaliacao;
use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\Doador;
use App\Models\Instituicao;
use App\Models\ItemDoacao;
use App\Models\User;

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
