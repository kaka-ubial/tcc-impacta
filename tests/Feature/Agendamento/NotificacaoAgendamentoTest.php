<?php

use App\Enums\AgendamentoStatus;
use App\Models\CategoriaItem;
use App\Models\User;
use App\Notifications\AgendamentoCriado;
use App\Notifications\DoacaoSolicitada;
use App\Notifications\NovaDataSugerida;
use App\Notifications\SugestaoDeDataRespondida;
use App\Services\AgendaService;
use App\Services\DoacaoService;
use Illuminate\Support\Facades\Notification;

/*
|--------------------------------------------------------------------------
| RF10 — notificações de agendamento
|--------------------------------------------------------------------------
|
| Notification::fake() é usado em vez de Mail::fake() porque o
| NotificacaoChannel não envia um Mailable — MailChannel chama
| Mailer::send() diretamente, e MailFake::sendMail() ignora tudo que não
| for um Mailable, então a asserção nunca dispara. Ver ADR 0003.
*/

test('doador e instituição são notificados quando uma doação com agendamento é criada', function () {
    Notification::fake();

    $doadorUser = criarDoadorUser();
    $instituicao = criarInstituicaoComHorario();
    $instituicaoUser = User::find($instituicao->usuario_id);
    $categoria = CategoriaItem::firstOrCreate(['nome' => 'Roupas']);

    $doacao = app(DoacaoService::class)->store([
        'instituicao_id' => $instituicao->usuario_id,
        'itens' => [
            ['categoria_id' => $categoria->id, 'quantidade' => 2],
        ],
        'agendamento' => [
            'tipo' => 'coleta',
            'data_hora' => now()->addDays(2)->toDateTimeString(),
            'endereco_referencia' => 'Portão azul',
        ],
    ], $doadorUser);

    Notification::assertSentTo(
        $doadorUser,
        AgendamentoCriado::class,
        fn (AgendamentoCriado $n) => $n->toMail($doadorUser)->subject === 'Agendamento confirmado'
    );

    Notification::assertSentTo(
        $instituicaoUser,
        DoacaoSolicitada::class,
        fn (DoacaoSolicitada $n) => str_contains($n->toNotificacao($instituicaoUser)->mensagem, 'Maria Doadora')
    );

    expect($doacao->agendamento)->not->toBeNull();
});

test('doador é notificado quando a instituição sugere uma nova data', function () {
    Notification::fake();

    $instituicao = criarInstituicaoComHorario();
    $doadorUser = criarDoadorUser();
    $instituicaoUser = User::find($instituicao->usuario_id);

    $agendamento = criarAgendamento($instituicao, $doadorUser);
    $novaData = now()->addDays(5)->startOfMinute();

    app(AgendaService::class)->sugerirAlteracao(
        ['data_hora_sugerida' => $novaData->toDateTimeString()],
        $agendamento,
        $instituicaoUser,
    );

    Notification::assertSentTo(
        $doadorUser,
        NovaDataSugerida::class,
        fn (NovaDataSugerida $n) => $n->toMail($doadorUser)->subject === 'Nova data sugerida para o seu agendamento'
    );

    expect($agendamento->fresh()->status)->toBe(AgendamentoStatus::AlteracaoSugerida);
});

test('instituição é notificada quando o doador aceita a data sugerida', function () {
    Notification::fake();

    $instituicao = criarInstituicaoComHorario();
    $doadorUser = criarDoadorUser();
    $instituicaoUser = User::find($instituicao->usuario_id);
    $novaData = now()->addDays(5)->startOfMinute();

    $agendamento = criarAgendamento(
        $instituicao,
        $doadorUser,
        status: 'alteracao_sugerida',
        dataHoraSugerida: $novaData->toDateTimeString(),
    );

    app(DoacaoService::class)->aceitarSugestao($agendamento->doacao, $doadorUser);

    Notification::assertSentTo(
        $instituicaoUser,
        SugestaoDeDataRespondida::class,
        fn (SugestaoDeDataRespondida $n) => $n->toMail($instituicaoUser)->subject === 'Nova data aceita'
    );

    expect($agendamento->fresh())
        ->status->toBe(AgendamentoStatus::Confirmado)
        ->data_hora_sugerida->toBeNull();
});

test('instituição é notificada quando o doador recusa a data sugerida', function () {
    Notification::fake();

    $instituicao = criarInstituicaoComHorario();
    $doadorUser = criarDoadorUser();
    $instituicaoUser = User::find($instituicao->usuario_id);
    $novaData = now()->addDays(5)->startOfMinute();

    $agendamento = criarAgendamento(
        $instituicao,
        $doadorUser,
        status: 'alteracao_sugerida',
        dataHoraSugerida: $novaData->toDateTimeString(),
    );

    app(DoacaoService::class)->recusarSugestao($agendamento->doacao, $doadorUser);

    Notification::assertSentTo(
        $instituicaoUser,
        SugestaoDeDataRespondida::class,
        fn (SugestaoDeDataRespondida $n) => $n->toMail($instituicaoUser)->subject === 'Nova data recusada'
    );

    expect($agendamento->fresh())->data_hora_sugerida->toBeNull();
});
