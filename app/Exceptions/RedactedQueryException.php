<?php

declare(strict_types = 1);

namespace App\Exceptions;

use RuntimeException;

/**
 * Apresentação destinada aos consumidores de JobFailed, nunca ao worker.
 * A conversão para string não pode incluir previous nem trace.
 */
final class RedactedQueryException extends RuntimeException
{
    public function __construct(string $exceptionClass, ?string $sqlstate)
    {
        parent::__construct($exceptionClass . ' (SQLSTATE: ' . ($sqlstate ?? 'unknown') . ')');
    }

    public function __toString(): string
    {
        return $this->getMessage();
    }
}
