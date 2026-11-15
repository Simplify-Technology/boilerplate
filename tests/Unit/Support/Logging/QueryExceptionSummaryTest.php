<?php

declare(strict_types = 1);

use App\Exceptions\RedactedQueryException;
use App\Support\Logging\QueryExceptionSummary;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;

it('keeps only a valid sqlstate from database errors', function(?string $state, ?string $expected) {
    $previous            = new PDOException('private driver detail');
    $previous->errorInfo = [$state, 19, 'private driver detail'];
    $exception           = new QueryException('private connection', 'select ?', ['private binding'], $previous);

    expect(QueryExceptionSummary::from($exception))->toBe([
        'exception_class' => QueryException::class,
        'sqlstate'        => $expected,
    ]);
})->with([
    'valid'            => ['23000', '23000'],
    'missing'          => [null, null],
    'sensitive value'  => ['private state sentinel', null],
    'trailing newline' => ["HY000\n", null],
]);

it('retains the concrete query exception class through wrappers', function() {
    $previous            = new PDOException('private driver detail');
    $previous->errorInfo = ['23000', 19, 'private driver detail'];
    $query               = new UniqueConstraintViolationException('private connection', 'select ?', ['private binding'], $previous);

    expect(QueryExceptionSummary::from(new RuntimeException('private wrapper', previous: $query)))->toBe([
        'exception_class' => UniqueConstraintViolationException::class,
        'sqlstate'        => '23000',
    ]);
});

it('does not classify ordinary exceptions as query failures', function() {
    expect(QueryExceptionSummary::from(new RuntimeException('ordinary failure')))->toBeNull();
    expect(QueryExceptionSummary::from(null))->toBeNull();
});

it('serializes the failure presentation without a previous exception or trace', function() {
    $exception = new RedactedQueryException(QueryException::class, 'HY000');

    expect($exception->getPrevious())->toBeNull();
    expect((string) $exception)->toBe('Illuminate\Database\QueryException (SQLSTATE: HY000)');
});
