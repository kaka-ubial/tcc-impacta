<?php

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * Centraliza a conversão UTC -> America/Sao_Paulo e a formatação pt-BR usada
 * nos e-mails do RF10. config/app.php roda em UTC (padrão do projeto), então
 * qualquer texto voltado ao usuário precisa passar por aqui antes de ser
 * impresso — o frontend "converte de graça" no browser, mas o e-mail é
 * renderizado no servidor.
 */
class DateTimeFormatter
{
    public const TIMEZONE = 'America/Sao_Paulo';

    public static function dataHora(CarbonInterface $dataHora): string
    {
        return $dataHora->clone()
            ->setTimezone(self::TIMEZONE)
            ->locale('pt_BR')
            ->translatedFormat('d/m/Y \à\s H:i');
    }
}
