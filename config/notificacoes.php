<?php

use App\Notifications\Channels\NotificacaoChannel;

return [

    'channels' => [
        NotificacaoChannel::class,
        'mail',
    ],

];
