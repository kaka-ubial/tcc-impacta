<?php

namespace App\Logging;

use Monolog\Logger;

/**
 * Fabrica do canal `loki` do config/logging.php.
 */
class LokiChannel
{
    public function __invoke(array $config): Logger
    {
        $handler = new LokiHttpHandler(
            endpoint: (string) ($config['url'] ?? ''),
            username: (string) ($config['username'] ?? ''),
            password: (string) ($config['password'] ?? ''),
            labels: $config['labels'] ?? [],
            level: $config['level'] ?? 'debug',
        );

        return new Logger('loki', [$handler]);
    }
}
