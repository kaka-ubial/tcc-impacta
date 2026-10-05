<?php

namespace App\Notifications;

use App\Notifications\Messages\NotificacaoMessage;
use App\Support\DateTimeFormatter;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Enviada à instituição quando um doador cria uma doação com um horário de
 * agendamento. Disparada em DoacaoService::store().
 */
class DoacaoSolicitada extends AgendamentoNotification
{
    public function toNotificacao(object $notifiable): NotificacaoMessage
    {
        $doador = $this->agendamento->doacao->doador->nome_completo;
        $dataHora = DateTimeFormatter::dataHora($this->agendamento->data_hora);

        return new NotificacaoMessage(
            titulo: 'Nova solicitação de doação',
            mensagem: "{$doador} enviou uma nova solicitação de doação, agendada para {$dataHora}."
        );
    }

    public function toMail(object $notifiable): MailMessage
    {
        $doador = $this->agendamento->doacao->doador->nome_completo;
        $dataHora = DateTimeFormatter::dataHora($this->agendamento->data_hora);
        $tipo = $this->agendamento->tipo === 'coleta' ? 'coleta' : 'entrega';

        return (new MailMessage)
            ->subject('Nova solicitação de doação')
            ->greeting('Olá!')
            ->line("{$doador} enviou uma nova solicitação de doação.")
            ->line("A {$tipo} está agendada para **{$dataHora}**.")
            ->salutation('Equipe Impacta');
    }
}
