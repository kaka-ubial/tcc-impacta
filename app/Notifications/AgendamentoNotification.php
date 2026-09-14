<?php

namespace App\Notifications;

use App\Models\Agendamento;
use App\Notifications\Channels\NotificacaoChannel;
use App\Notifications\Messages\NotificacaoMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Base das 4 notificações do RF10. ShouldQueueAfterCommit garante que o
 * e-mail só é enfileirado depois que a transação do Service commitou — se a
 * doação/agendamento não for salvo, nenhum e-mail sai. viaConnections() fixa
 * o canal do sino em "sync" para que ele continue funcionando mesmo sem um
 * worker rodando (é o caso do Render free tier e do ambiente de dev/demo).
 * Ver ADR 0003.
 */
abstract class AgendamentoNotification extends Notification implements ShouldQueueAfterCommit
{
    use Queueable;

    public function __construct(
        protected readonly Agendamento $agendamento,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return config('notificacoes.channels', [NotificacaoChannel::class, 'mail']);
    }

    /**
     * @return array<string, string>
     */
    public function viaConnections(): array
    {
        return [
            NotificacaoChannel::class => 'sync',
        ];
    }

    abstract public function toNotificacao(object $notifiable): NotificacaoMessage;

    abstract public function toMail(object $notifiable): MailMessage;
}
