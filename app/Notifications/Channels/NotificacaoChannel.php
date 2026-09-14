<?php

namespace App\Notifications\Channels;

use App\Models\Notificacao;
use App\Notifications\Messages\NotificacaoMessage;
use Illuminate\Notifications\Notification;

/**
 * Canal customizado que grava o sino in-app. Delega para o writer que já
 * existia antes do RF10 (Notificacao::enviar()) para que as linhas geradas
 * por notificações novas fiquem idênticas às antigas — NotificacaoController
 * e a página notificacoes.tsx não precisam mudar.
 */
class NotificacaoChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toNotificacao')) {
            return;
        }

        /** @var NotificacaoMessage $mensagem */
        $mensagem = $notification->toNotificacao($notifiable);

        Notificacao::enviar($notifiable->getKey(), $mensagem->titulo, $mensagem->mensagem);
    }
}
