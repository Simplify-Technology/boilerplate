<?php

declare(strict_types = 1);

use App\Listeners\SanitizeFailedQueryException;
use App\Support\Logging\PiiAwareTap;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Queue\Console\WorkCommand;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;
use Laravel\Horizon\Listeners\MarshalFailedEvent;
use Symfony\Component\HttpKernel\Exception\HttpException;

beforeEach(function() {
    $this->logPath = storage_path('logs/query-exception-' . bin2hex(random_bytes(8)) . '.log');
    config()->set([
        'app.debug'                             => false,
        'logging.default'                       => 'query_exception_test',
        'logging.channels.query_exception_test' => [
            'driver' => 'single', 'path' => $this->logPath, 'tap' => [PiiAwareTap::class],
        ],
        'queue.connections.database.connection' => 'sqlite',
        'queue.failed.driver'                   => 'database-uuids',
        'queue.failed.database'                 => 'sqlite',
    ]);
    WorkCommand::flushState();
    QueryExceptionReportingJob::$original = null;
    QueryExceptionReportingJob::$failed   = null;
});

afterEach(function() {
    Log::forgetChannel('query_exception_test');

    if (file_exists($this->logPath)) {
        unlink($this->logPath);
    }
});

it('reports a real failed query without sending its sql or bindings to later reporters', function(bool $wrapped) {
    $reported = [];
    $records  = [];
    Event::listen(MessageLogged::class, function(MessageLogged $event) use (&$records): void {
        $records[] = $event;
    });
    app(ExceptionHandler::class)->reportable(function(Throwable $exception) use (&$reported): void {
        $reported[] = $exception;
    });
    Route::get('/_query-failure', function() use ($wrapped): void {
        try {
            DB::select('select ? from private_query_probe', ['private binding sentinel']);
        } catch (QueryException $exception) {
            throw $wrapped ? new RuntimeException('private wrapper sentinel', previous: $exception) : $exception;
        }
    });
    $this->getJson('/_query-failure')->assertStatus(500);
    expect(file_exists($this->logPath))->toBeTrue();
    $written = file_get_contents($this->logPath);
    expect($written)->toContain('QueryException')->toContain('HY000');

    foreach (['private_query_probe', 'private binding sentinel', 'private wrapper sentinel', 'select ?', 'Stack trace'] as $sensitive) {
        expect($written)->not->toContain($sensitive);
    }
    expect($reported)->toBe([]);
    expect($records)->toHaveCount(1);
    expect($records[0]->context)->toBe([
        'exception_class' => QueryException::class,
        'sqlstate'        => 'HY000',
    ]);
})->with(['direta' => false, 'encapsulada' => true]);

it('preserves the status and headers of an http exception wrapping a real query failure', function() {
    Route::get('/_query-http-status', function(): void {
        try {
            DB::select('select ? from private_query_probe', ['private binding sentinel']);
        } catch (QueryException $exception) {
            throw new HttpException(503, 'Unavailable', $exception, ['Retry-After' => '45']);
        }
    });
    $this->getJson('/_query-http-status')->assertStatus(503)->assertHeader('Retry-After', '45');
});

it('keeps normal reporting for failures unrelated to queries', function() {
    $reported = [];
    app(ExceptionHandler::class)->reportable(function(Throwable $exception) use (&$reported): void {
        $reported[] = $exception;
    });
    Route::get('/_ordinary-failure', fn() => throw new RuntimeException('ordinary operational failure'));
    $this->getJson('/_ordinary-failure')->assertStatus(500);
    expect(file_exists($this->logPath))->toBeTrue();
    expect(file_get_contents($this->logPath))->toContain('ordinary operational failure');
    expect($reported)->toHaveCount(1);
    expect($reported[0])->toBeInstanceOf(RuntimeException::class);
});

it('persists a real failed job with safe exception output and its retry payload intact', function(bool $wrapped) {
    $observed = null;
    Event::listen(JobFailed::class, function(JobFailed $event) use (&$observed): void {
        $observed = $event->exception;
    });
    Queue::connection('database')->push(new QueryExceptionReportingJob($wrapped), queue: 'query-probe');
    $payload = DB::table('jobs')->sole()->payload;
    expect(Artisan::call('queue:work', [
        'connection' => 'database', '--queue' => 'query-probe', '--once' => true, '--tries' => 1, '--json' => true,
    ]))->toBe(0);
    expect(DB::table('jobs')->count())->toBe(0);
    expect(DB::table('failed_jobs')->count())->toBe(1);
    $failure = DB::table('failed_jobs')->sole();
    expect($failure->payload)->toBe($payload);
    expect($failure->uuid)->toBe(json_decode($payload, true)['uuid']);
    expect(file_exists($this->logPath))->toBeTrue();

    foreach ([$failure->exception, file_get_contents($this->logPath), Artisan::output()] as $output) {
        expect($output)->toContain('QueryException')->toContain('HY000');

        foreach (['private_query_probe', 'private binding sentinel', 'private wrapper sentinel', 'Stack trace'] as $sensitive) {
            expect($output)->not->toContain($sensitive);
        }
    }
    expect($observed)->toBeInstanceOf(Throwable::class);
    expect($observed->getPrevious())->toBeNull();
    expect((string) $observed)->toBe($observed->getMessage());
    expect($observed)->not->toBe(QueryExceptionReportingJob::$original);
    expect(QueryExceptionReportingJob::$failed)->toBe(QueryExceptionReportingJob::$original);
    expect((string) QueryExceptionReportingJob::$original)->toContain('private binding sentinel');
})->with(['direta' => false, 'encapsulada' => true]);

it('keeps the original exception for failed jobs unrelated to queries', function() {
    $observed = null;
    Event::listen(JobFailed::class, function(JobFailed $event) use (&$observed): void {
        $observed = $event->exception;
    });
    Queue::connection('database')->push(new QueryExceptionReportingJob(ordinary: true), queue: 'query-probe');
    expect(Artisan::call('queue:work', [
        'connection' => 'database', '--queue' => 'query-probe', '--once' => true, '--tries' => 1,
    ]))->toBe(0);
    expect(DB::table('failed_jobs')->count())->toBe(1);
    expect(DB::table('failed_jobs')->sole()->exception)->toContain('ordinary operational failure');
    expect(file_exists($this->logPath))->toBeTrue();
    expect(file_get_contents($this->logPath))->toContain('ordinary operational failure');
    expect($observed)->toBe(QueryExceptionReportingJob::$original);
});

it('registers the sanitizer exactly once before horizon receives failed jobs', function() {
    $listeners = Event::getRawListeners()[JobFailed::class];
    $sanitizer = [SanitizeFailedQueryException::class, 'sanitize'];
    expect(array_keys($listeners, $sanitizer, true))->toHaveCount(1);
    expect(array_search(MarshalFailedEvent::class, $listeners, true))->not->toBeFalse();
    expect(array_search($sanitizer, $listeners, true))
        ->toBeLessThan(array_search(MarshalFailedEvent::class, $listeners, true));
});

final class QueryExceptionReportingJob implements ShouldQueue
{
    use Queueable;

    public static ?Throwable $original = null;

    public static ?Throwable $failed = null;

    public function __construct(public bool $wrapped = false, public bool $ordinary = false)
    {
    }

    public function handle(): void
    {
        try {
            if ($this->ordinary) {
                throw new RuntimeException('ordinary operational failure');
            }
            DB::select('select ? from private_query_probe', ['private binding sentinel']);
        } catch (Throwable $exception) {
            self::$original = $this->wrapped
                ? new RuntimeException('private wrapper sentinel', previous: $exception)
                : $exception;

            throw self::$original;
        }
    }

    public function failed(?Throwable $exception): void
    {
        self::$failed = $exception;
    }
}
