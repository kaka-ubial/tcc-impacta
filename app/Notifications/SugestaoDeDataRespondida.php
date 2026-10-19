<?php

namespace App\Notifications;

use App\Models\Agendamento;
use App\Notifications\Messages\NotificacaoMessage;
use App\Support\DateTimeFormatter;
use Carbon\CarbonInterface;
use Illuminate\Notifications\Messages\MailMessage;

class SugestaoDeDataRespondida extends AgendamentoNotification
{
    public function __construct(
        Agendamento $agendamento,
        protected readonly CarbonInterface $dataSugerida,
        protected readonly bool $aceitou,
    ) {
        parent::__construct($agendamento);
    }

    public function toNotificacao(object $notifiable): NotificacaoMessage
    {
        $doador = $this->agendamento->doacao->doador->nome_completo;
        $dataHora = DateTimeFormatter::dataHora($this->dataSugerida);
        $verbo = $this->aceitou ? 'aceitou' : 'recusou';

        return new NotificacaoMessage(
            titulo: $this->aceitou ? 'Nova data aceita' : 'Nova data recusada',
            mensagem: "{$doador} {$verbo} a data sugerida ({$dataHora}).",
            url: '/instituicao/agenda'
        );
    }

    public function toMail(object $notifiable): MailMessage
    {
        $doador = $this->agendamento->doacao->doador->nome_completo;
        $dataHora = DateTimeFormatter::dataHora($this->dataSugerida);
        $verbo = $this->aceitou ? 'aceitou' : 'recusou';

        $mail = (new MailMessage)
            ->subject($this->aceitou ? 'Nova data aceita' : 'Nova data recusada')
            ->greeting('Olá!')
            ->line("{$doador} {$verbo} a data que você sugeriu: **{$dataHora}**.");

        if ($this->aceitou) {
            $mail->line('O agendamento já está confirmado com essa data.');
        } else {
            $mail->line('O agendamento permanece com a data anterior. Você pode sugerir outra data pelo seu painel.');
        }

        return $mail->salutation('Equipe Impacta');
    }
}
