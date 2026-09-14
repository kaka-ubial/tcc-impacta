<?php

namespace App\Notifications;

use App\Notifications\Messages\NotificacaoMessage;
use App\Support\DateTimeFormatter;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * enviada ao doador quando ele cria uma doação com um horário de agendamento.
 */
class AgendamentoCriado extends AgendamentoNotification
{
    public function toNotificacao(object $notifiable): NotificacaoMessage
    {
        $dataHora = DateTimeFormatter::dataHora($this->agendamento->data_hora);
        $instituicao = $this->agendamento->doacao->instituicao->nome_fantasia;

        return new NotificacaoMessage(
            titulo: 'Agendamento confirmado',
            mensagem: "Sua doação para {$instituicao} foi agendada para {$dataHora}."
        );
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dataHora = DateTimeFormatter::dataHora($this->agendamento->data_hora);
        $instituicao = $this->agendamento->doacao->instituicao->nome_fantasia;
        $tipo = $this->agendamento->tipo === 'coleta' ? 'coleta' : 'entrega';

        $mail = (new MailMessage)
            ->subject('Agendamento confirmado')
            ->greeting('Olá!')
            ->line("Sua solicitação de doação para {$instituicao} foi registrada.")
            ->line("A {$tipo} está agendada para **{$dataHora}**.");

        if ($this->agendamento->endereco_referencia) {
            $mail->line("Referência de endereço: {$this->agendamento->endereco_referencia}");
        }

        return $mail->salutation('Obrigado por doar!');
    }
}
