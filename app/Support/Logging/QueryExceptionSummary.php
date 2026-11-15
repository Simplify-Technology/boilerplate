<?php

declare(strict_types = 1);

namespace App\Support\Logging;

use Illuminate\Database\QueryException;
use Throwable;

final class QueryExceptionSummary
{
    /**
     * @return array{exception_class: class-string<QueryException>, sqlstate: string|null}|null
     */
    public static function from(?Throwable $exception): ?array
    {
        while ($exception instanceof \Throwable) {
            if ($exception instanceof QueryException) {
                $sqlstate = $exception->errorInfo[0] ?? $exception->getCode();

                return [
                    'exception_class' => $exception::class,
                    'sqlstate'        => is_string($sqlstate) && preg_match('/\\A[A-Z0-9]{5}\\z/', $sqlstate) === 1
                        ? $sqlstate
                        : null,
                ];
            }

            $exception = $exception->getPrevious();
        }

        return null;
    }
}
