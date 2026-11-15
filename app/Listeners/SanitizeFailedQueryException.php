<?php

declare(strict_types = 1);

namespace App\Listeners;

use App\Exceptions\RedactedQueryException;
use App\Support\Logging\QueryExceptionSummary;
use Illuminate\Queue\Events\JobFailed;

final class SanitizeFailedQueryException
{
    public function sanitize(JobFailed $event): void
    {
        $summary = QueryExceptionSummary::from($event->exception);

        if ($summary !== null) {
            $event->exception = new RedactedQueryException($summary['exception_class'], $summary['sqlstate']);
        }
    }
}
