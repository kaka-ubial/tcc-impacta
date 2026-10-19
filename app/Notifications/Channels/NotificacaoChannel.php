<?php

namespace App\Notifications\Channels;

use App\Models\Notificacao;
use App\Notifications\Messages\NotificacaoMessage;
use Illuminate\Notifications\Notification;

class NotificacaoChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toNotificacao')) {
            return;
        }

        $mensagem = $notification->toNotificacao($notifiable);

        Notificacao::enviar($notifiable->getKey(), $mensagem->titulo, $mensagem->mensagem, $mensagem->url);
    }
}
