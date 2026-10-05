<?php

use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mime\Email;

/*
|--------------------------------------------------------------------------
| MAIL_OVERRIDE_TO — redirecionamento de e-mail para testes
|--------------------------------------------------------------------------
|
| Envia via Mail::html() (síncrono, fora do sistema de Notifications/queue)
| para exercitar App\Listeners\RedirectMailToOverride isoladamente, e lê a
| mensagem de volta no transporte "array" que phpunit.xml já força — mesma
| receita descrita no feature doc do RF10 para inspecionar o corpo real do
| e-mail (Mail::fake() não funciona para notifications).
*/

function ultimaMensagemEnviada(): Email
{
    return Mail::mailer('array')
        ->getSymfonyTransport()
        ->messages()
        ->last()
        ->getOriginalMessage();
}

test('sem MAIL_OVERRIDE_TO, o e-mail sai para o destinatário original', function () {
    config(['mail.override_to' => null]);

    Mail::html('<html><body><p>Olá, doador!</p></body></html>', function ($message) {
        $message->to('doador@example.com')->subject('Assunto de teste');
    });

    $mensagem = ultimaMensagemEnviada();

    expect($mensagem->getTo())->toHaveCount(1);
    expect($mensagem->getTo()[0]->getAddress())->toBe('doador@example.com');
    expect($mensagem->getSubject())->toBe('Assunto de teste');
    expect($mensagem->getHtmlBody())->not->toContain('seria enviado para');
});

test('com MAIL_OVERRIDE_TO, o e-mail é redirecionado mas o destinatário original continua visível', function () {
    config(['mail.override_to' => 'owner@example.com']);

    Mail::html('<html><body><p>Olá, doador!</p></body></html>', function ($message) {
        $message->to('doador@example.com')->subject('Assunto de teste');
    });

    $mensagem = ultimaMensagemEnviada();

    expect($mensagem->getTo())->toHaveCount(1);
    expect($mensagem->getTo()[0]->getAddress())->toBe('owner@example.com');
    expect($mensagem->getSubject())->toBe('[para: doador@example.com] Assunto de teste');
    expect($mensagem->getHtmlBody())->toContain('Este e-mail seria enviado para: doador@example.com');
    expect($mensagem->getHtmlBody())->toContain('Olá, doador!');
});

test('com MAIL_OVERRIDE_TO, o Cc original também é resumido no destinatário exibido e removido do envelope', function () {
    config(['mail.override_to' => 'owner@example.com']);

    Mail::html('<html><body><p>Olá!</p></body></html>', function ($message) {
        $message->to('doador@example.com')
            ->cc('copia@example.com')
            ->subject('Com cópia');
    });

    $mensagem = ultimaMensagemEnviada();

    expect($mensagem->getTo())->toHaveCount(1);
    expect($mensagem->getTo()[0]->getAddress())->toBe('owner@example.com');
    expect($mensagem->getCc())->toBeEmpty();
    expect($mensagem->getSubject())->toContain('doador@example.com');
    expect($mensagem->getSubject())->toContain('copia@example.com');
});
