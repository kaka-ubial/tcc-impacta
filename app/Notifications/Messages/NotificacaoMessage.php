<?php

namespace App\Notifications\Messages;

class NotificacaoMessage
{
    public function __construct(
        public readonly string $titulo,
        public readonly string $mensagem,
        public readonly ?string $url = null,
    ) {
        if (mb_strlen($this->mensagem) > 160) {
            throw new \InvalidArgumentException('NotificacaoMessage::mensagem deve ter no máximo 160 caracteres.');
        }
    }
}
