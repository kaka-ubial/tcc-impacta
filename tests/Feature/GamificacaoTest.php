<?php

use App\Models\Badge;
use App\Models\Causa;
use App\Models\Doacao;
use App\Models\Doador;
use App\Models\Instituicao;
use App\Models\Notificacao;
use App\Models\User;
use App\Services\GamificacaoService;
use Database\Seeders\BadgeSeeder;

beforeEach(function () {
    (new BadgeSeeder)->run();
});

function gamDoador(): Doador
{
    $user = User::factory()->create(['tipo_usuario' => 'doador']);

    return Doador::create([
        'usuario_id' => $user->id,
        'nome_completo' => 'Doador Teste',
        'cpf' => fake('pt_BR')->cpf(),
        'telefone' => '(41) 91234-5678',
        'pontuacao_gamificacao' => 0,
    ]);
}

function gamInstituicao(array $causas = []): Instituicao
{
    $user = User::factory()->create(['tipo_usuario' => 'instituicao']);
    $inst = Instituicao::factory()->create(['usuario_id' => $user->id, 'status' => 'approved']);
    $user->causas()->sync($causas);

    return $inst;
}

function gamEntrega(Doador $d, Instituicao $i): Doacao
{
    return Doacao::create([
        'doador_id' => $d->usuario_id,
        'instituicao_id' => $i->usuario_id,
        'status' => 'entregue',
        'data_entrega' => now(),
    ]);
}

test('doacao entregue gera pontos e o badge de primeira doacao', function () {
    $doador = gamDoador();
    $inst = gamInstituicao();

    $novos = app(GamificacaoService::class)->registrarEntrega(gamEntrega($doador, $inst));

    expect(collect($novos)->pluck('codigo')->all())->toBe(['primeira-doacao']);
    // 10 pela entrega + 5 por instituição nova
    expect($doador->fresh()->pontuacao_gamificacao)->toBe(15);
    expect(Notificacao::where('usuario_id', $doador->usuario_id)->where('titulo', 'Nova conquista!')->count())->toBe(1);
});

test('processar a mesma doacao duas vezes nao duplica pontos', function () {
    $doador = gamDoador();
    $doacao = gamEntrega($doador, gamInstituicao());
    $service = app(GamificacaoService::class);

    $service->registrarEntrega($doacao);
    $segunda = $service->registrarEntrega($doacao);

    expect($segunda)->toBe([]);
    expect($doador->fresh()->pontuacao_gamificacao)->toBe(15);
});

test('bonus de nova instituicao so vale na primeira doacao para ela', function () {
    $doador = gamDoador();
    $inst = gamInstituicao();
    $service = app(GamificacaoService::class);

    $service->registrarEntrega(gamEntrega($doador, $inst));
    $service->registrarEntrega(gamEntrega($doador, $inst));

    expect($doador->fresh()->pontuacao_gamificacao)->toBe(15 + 10);
});

test('cinco doacoes entregues liberam doador constante', function () {
    $doador = gamDoador();
    $inst = gamInstituicao();
    $service = app(GamificacaoService::class);

    foreach (range(1, 5) as $_) {
        $service->registrarEntrega(gamEntrega($doador, $inst));
    }

    expect($doador->badges()->pluck('codigo')->all())
        ->toContain('primeira-doacao', 'doador-constante');
});

test('tres causas diferentes liberam parceiro das causas', function () {
    $doador = gamDoador();
    $causas = collect(['A', 'B', 'C'])->map(fn ($n) => Causa::create(['nome' => 'Causa '.$n, 'icone' => 'heart'])->id)->all();
    $service = app(GamificacaoService::class);

    foreach ($causas as $causa) {
        $service->registrarEntrega(gamEntrega($doador, gamInstituicao([$causa])));
    }

    expect($doador->badges()->pluck('codigo')->all())->toContain('parceiro-das-causas');
});

test('cinco instituicoes distintas liberam impacto local', function () {
    $doador = gamDoador();
    $service = app(GamificacaoService::class);

    foreach (range(1, 5) as $_) {
        $service->registrarEntrega(gamEntrega($doador, gamInstituicao()));
    }

    expect($doador->badges()->pluck('codigo')->all())->toContain('impacto-local');
});

test('doacao nao entregue nao pontua', function () {
    $doador = gamDoador();
    $doacao = Doacao::create([
        'doador_id' => $doador->usuario_id,
        'instituicao_id' => gamInstituicao()->usuario_id,
        'status' => 'pendente',
    ]);

    expect(app(GamificacaoService::class)->registrarEntrega($doacao))->toBe([]);
    expect($doador->fresh()->pontuacao_gamificacao)->toBe(0);
});

test('comando de backfill e idempotente e nao notifica', function () {
    $doador = gamDoador();
    $inst = gamInstituicao();
    gamEntrega($doador, $inst);
    gamEntrega($doador, $inst);

    $this->artisan('gamificacao:recalcular')->assertSuccessful();
    $this->artisan('gamificacao:recalcular')->assertSuccessful();

    expect($doador->fresh()->pontuacao_gamificacao)->toBe(25);
    expect($doador->badges()->count())->toBe(1);
    expect(Notificacao::where('usuario_id', $doador->usuario_id)->count())->toBe(0);
});

test('compartilhar e opt-in, gera link publico e pode ser revogado', function () {
    $doador = gamDoador();
    app(GamificacaoService::class)->registrarEntrega(gamEntrega($doador, gamInstituicao()));
    $badge = $doador->badges()->first();

    $conquista = fn () => collect(app(GamificacaoService::class)->conquistas($doador->fresh()))->firstWhere('id', $badge->id);
    expect($conquista()['url_compartilhamento'])->toBeNull();

    $this->actingAs($doador->usuario)->post(route('conquistas.compartilhar', $badge))->assertRedirect();
    $url = $conquista()['url_compartilhamento'];
    expect($url)->not->toBeNull();

    auth()->logout();
    $this->get($url)
        ->assertOk()
        ->assertSee('og:image', false)
        ->assertSee('Um doador da plataforma')
        ->assertDontSee('Doador Teste');

    $this->actingAs($doador->usuario)->delete(route('conquistas.revogar', $badge));
    $this->get($url)->assertNotFound();
});

test('nome so aparece na pagina publica se o doador autorizou', function () {
    $doador = gamDoador();
    $doador->update(['exibir_em_transparencia' => true]);
    app(GamificacaoService::class)->registrarEntrega(gamEntrega($doador, gamInstituicao()));
    $badge = $doador->badges()->first();

    $this->actingAs($doador->usuario)->post(route('conquistas.compartilhar', $badge));
    $url = collect(app(GamificacaoService::class)->conquistas($doador->fresh()))->firstWhere('id', $badge->id)['url_compartilhamento'];

    $this->get($url)->assertSee('Doador Teste');
});

test('doador nao compartilha badge que nao conquistou', function () {
    $doador = gamDoador();
    $badge = Badge::first();

    $this->actingAs($doador->usuario)->post(route('conquistas.compartilhar', $badge))->assertNotFound();
});

test('token inexistente devolve 404', function () {
    $this->get(route('conquistas.publica', 'nao-existe'))->assertNotFound();
});
