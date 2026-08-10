<?php

declare(strict_types = 1);

namespace App\Support\Logging;

use Illuminate\Log\Logger;
use Monolog\Logger as Monolog;

/**
 * "Tap" de canal de log que empilha o {@see PiiScrubbingProcessor} na
 * instância Monolog subjacente — todo registro que passa pelo canal é
 * redigido antes de chegar a um handler.
 *
 * Registrado em `config/logging.php` nos canais `single`, `daily` e `stack`.
 * A dupla passagem (stack + filho) é inofensiva: o scrub é idempotente porque
 * `[REDACTED]` e os placeholders não casam com nenhum padrão de scrub.
 */
final class PiiAwareTap
{
    public function __invoke(Logger $logger): void
    {
        $monolog = $logger->getLogger();

        if ($monolog instanceof Monolog) {
            $monolog->pushProcessor(new PiiScrubbingProcessor());
        }
    }
}
