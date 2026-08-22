<?php

use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\Doador;
use App\Models\Instituicao;
use App\Models\ItemDoacao;
use App\Models\User;

function criarDoador(bool $exibir = false, string $nome = 'Karen Ubial', string $cpf = '529.982.247-25'): Doador
{
    $user = User::factory()->create(['tipo_usuario' => 'doador']);

    return Doador::create([
        'usuario_id'              => $user->id,
        'nome_completo'           => $nome,
        'cpf'                     => $cpf,
        'telefone'                => '(41) 91234-5678',
        'endereco_completo'       => 'Rua Secreta, 123 - Curitiba/PR',
        'pontuacao_gamificacao'   => 0,
        'exibir_em_transparencia' => $exibir,
        'latitude'                => -25.4,
        'longitude'               => -49.3,
    ]);
}

function criarInstituicao(string $nome = 'Casa de Apoio'): Instituicao
{
    $user = User::factory()->create(['tipo_usuario' => 'instituicao']);

    return Instituicao::factory()->create([
        'usuario_id'    => $user->id,
        'nome_fantasia' => $nome,
        'status'        => 'approved',
    ]);
}

function criarDoacao(Doador $doador, Instituicao $instituicao, string $status = 'entregue', ?string $dataEntrega = '2026-08-01'): Doacao
{
    $doacao = Doacao::create([
        'doador_id'      => $doador->usuario_id,
        'instituicao_id' => $instituicao->usuario_id,
        'status'         => $status,
        'data_entrega'   => $status === 'entregue' ? $dataEntrega : null,
    ]);

    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Alimentos']);

    ItemDoacao::create([
        'doacao_id'    => $doacao->id,
        'categoria_id' => $categoria->id,
        'descricao'    => 'Arroz e feijão',
        'quantidade'   => 5,
    ]);

    return $doacao;
}

test('o portal de transparência é público e não exige autenticação', function () {
    $this->get(route('transparencia'))->assertOk();
});

test('lista apenas doações entregues', function () {
    $doador = criarDoador();
    $instituicao = criarInstituicao('Casa Entregue');

    criarDoacao($doador, $instituicao, 'entregue');
    criarDoacao($doador, $instituicao, 'pendente');
    criarDoacao($doador, $instituicao, 'cancelado');
    criarDoacao($doador, $instituicao, 'recusada');
    criarDoacao($doador, $instituicao, 'nao_entregue');

    $this->get(route('transparencia'))
        ->assertInertia(fn ($page) => $page
            ->component('transparencia')
            ->has('doacoes.data', 1)
            ->where('total', 1)
        );
});

test('doador sem opt-in aparece como anônimo', function () {
    $doador = criarDoador(exibir: false, nome: 'Fulana Privada');
    criarDoacao($doador, criarInstituicao());

    $this->get(route('transparencia'))
        ->assertInertia(fn ($page) => $page->where('doacoes.data.0.doador', null));
});

test('doador com opt-in aparece identificado', function () {
    $doador = criarDoador(exibir: true, nome: 'Fulana Pública');
    criarDoacao($doador, criarInstituicao());

    $this->get(route('transparencia'))
        ->assertInertia(fn ($page) => $page->where('doacoes.data.0.doador', 'Fulana Pública'));
});

test('não expõe dados pessoais sensíveis no payload', function () {
    $doador = criarDoador(exibir: true, cpf: '529.982.247-25');
    criarDoacao($doador, criarInstituicao());

    $conteudo = $this->get(route('transparencia'))->getContent();

    expect($conteudo)
        ->not->toContain('529.982.247-25')
        ->not->toContain('Rua Secreta')
        ->not->toContain('cpf')
        ->not->toContain('endereco_completo')
        ->not->toContain('latitude');
});

test('filtra por instituição', function () {
    $doador = criarDoador();
    $alvo = criarInstituicao('Instituicao Alvo');
    $outra = criarInstituicao('Instituicao Outra');

    criarDoacao($doador, $alvo);
    criarDoacao($doador, $outra);

    $this->get(route('transparencia', ['instituicao' => $alvo->usuario_id]))
        ->assertInertia(fn ($page) => $page
            ->has('doacoes.data', 1)
            ->where('doacoes.data.0.instituicao', 'Instituicao Alvo')
        );
});

test('filtra por período', function () {
    $doador = criarDoador();
    $instituicao = criarInstituicao();

    criarDoacao($doador, $instituicao, 'entregue', '2026-01-15');
    criarDoacao($doador, $instituicao, 'entregue', '2026-08-15');

    $this->get(route('transparencia', ['de' => '2026-08-01', 'ate' => '2026-08-31']))
        ->assertInertia(fn ($page) => $page->has('doacoes.data', 1));
});

test('marcar doação como entregue grava a data de entrega', function () {
    $doador = criarDoador();
    $instituicao = criarInstituicao();

    $doacao = Doacao::create([
        'doador_id'      => $doador->usuario_id,
        'instituicao_id' => $instituicao->usuario_id,
        'status'         => 'confirmada',
    ]);

    expect($doacao->data_entrega)->toBeNull();

    $this->actingAs($instituicao->usuario)
        ->post(route('instituicao.doacoes.deliver', $doacao));

    expect($doacao->fresh()->data_entrega)->not->toBeNull();
});
