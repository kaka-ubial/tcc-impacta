<?php

namespace App\Logging;

use Monolog\Handler\AbstractProcessingHandler;
use Monolog\Level;
use Monolog\LogRecord;
use TomasKulhanek\Monolog\Loki\LokiJsonFormatter;

class LokiHttpHandler extends AbstractProcessingHandler
{
    public function __construct(
        private readonly string $endpoint,
        private readonly string $username,
        private readonly string $password,
        private readonly array $labels,
        int|string|Level $level = Level::Debug,
        bool $bubble = true,
    ) {
        parent::__construct($level, $bubble);
    }

    protected function getDefaultFormatter(): LokiJsonFormatter
    {
        return new LokiJsonFormatter($this->labels);
    }

    protected function write(LogRecord $record): void
    {
        if ($this->endpoint === '' || $this->username === '' || $this->password === '') {
            $this->reportar('configuracao incompleta: LOKI_URL, LOKI_USERNAME ou LOKI_PASSWORD vazio');

            return;
        }

        $ch = curl_init(rtrim($this->endpoint, '/').'/loki/api/v1/push');

        curl_setopt_array($ch, [
            CURLOPT_USERPWD => $this->username.':'.$this->password,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $record->formatted,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT_MS => 2000,
            CURLOPT_TIMEOUT_MS => 5000,
        ]);

        $corpo = curl_exec($ch);
        $codigo = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $erroCurl = curl_error($ch);

        if ($corpo === false) {
            $this->reportar("erro de transporte: {$erroCurl}");

            return;
        }

        if ($codigo !== 204) {
            $this->reportar("resposta HTTP {$codigo}: ".trim((string) $corpo));
        }
    }

    private function reportar(string $mensagem): void
    {
        file_put_contents('php://stderr', '[loki] falha ao enviar log — '.$mensagem.PHP_EOL);
    }
}
