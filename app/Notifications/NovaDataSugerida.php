<?php

namespace App\Notifications;

use App\Notifications\Messages\NotificacaoMessage;
use App\Support\DateTimeFormatter;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Enviada ao doador quando a instituição sugere uma nova data para o
 * agendamento. Disparada em AgendaService::sugerirAlteracao().
 */
class NovaDataSugerida extends AgendamentoNotification
{
    public function toNotificacao(object $notifiable): NotificacaoMessage
    {
        $instituicao = $this->agendamento->doacao->instituicao->nome_fantasia;
        $dataHora = DateTimeFormatter::dataHora($this->agendamento->data_hora_sugerida);

        return new NotificacaoMessage(
            titulo: 'Nova data sugerida',
            mensagem: "{$instituicao} sugeriu uma nova data para a sua doação: {$dataHora}."
        );
    }

    public function toMail(object $notifiable): MailMessage
    {
        $instituicao = $this->agendamento->doacao->instituicao->nome_fantasia;
        $dataHoraAtual = DateTimeFormatter::dataHora($this->agendamento->data_hora);
        $dataHoraSugerida = DateTimeFormatter::dataHora($this->agendamento->data_hora_sugerida);

        return (new MailMessage)
            ->subject('Nova data sugerida para o seu agendamento')
            ->greeting('Olá!')
            ->line("{$instituicao} sugeriu uma nova data para a sua doação, atualmente agendada para {$dataHoraAtual}.")
            ->line("Nova data proposta: **{$dataHoraSugerida}**.")
            ->line('Entre no seu painel para aceitar ou recusar a sugestão.')
            ->salutation('Obrigado por doar!');
    }
}
