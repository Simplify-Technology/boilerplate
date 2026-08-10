<?php

declare(strict_types = 1);

namespace App\Support\Logging;

use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

/**
 * Processor Monolog que passa cada registro pelo {@see PiiScrubber} antes de
 * chegar a um handler. Instalado no stack padrão via {@see PiiAwareTap}, de
 * modo que qualquer chamada `Log::*` nunca grave PII crua em disco.
 *
 * Message, context e extra são redigidos. Registros são imutáveis no Monolog
 * v3, então retornamos um {@see LogRecord} novo com o payload limpo.
 */
final readonly class PiiScrubbingProcessor implements ProcessorInterface
{
    public function __construct(private PiiScrubber $scrubber = new PiiScrubber())
    {
    }

    public function __invoke(LogRecord $record): LogRecord
    {
        /** @var array<string, mixed> $scrubbedContext */
        $scrubbedContext = $this->scrubber->scrub($record->context);

        /** @var array<string, mixed> $scrubbedExtra */
        $scrubbedExtra = $this->scrubber->scrub($record->extra);

        return $record->with(
            message: $this->scrubber->scrubString($record->message),
            context: $scrubbedContext,
            extra: $scrubbedExtra,
        );
    }
}
