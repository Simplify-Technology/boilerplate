<?php

declare(strict_types = 1);

use Symfony\Component\Process\Process;

it('keeps the test database in memory despite an inherited connection URL', function(string $url): void {
    $process = new Process([PHP_BINARY, '-r', <<<'PHP'
        require 'vendor/autoload.php';

        $configuration = (new PHPUnit\TextUI\XmlConfiguration\Loader(PHPUnit\Event\Facade::emitter()))->load('phpunit.xml');
        (new PHPUnit\TextUI\Configuration\PhpHandler(PHPUnit\Event\Facade::emitter()))->handle($configuration->php());

        $app = require 'bootstrap/app.php';
        $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

        $connection = $app->make('db')->connection();
        echo json_encode([
            'driver' => $connection->getConfig('driver'),
            'database' => $connection->getConfig('database'),
        ], JSON_THROW_ON_ERROR);
        PHP,
    ], dirname(__DIR__, 3), ['DB_URL' => $url]);

    $process->mustRun();

    expect(json_decode($process->getOutput(), true, flags: JSON_THROW_ON_ERROR))
        ->toBe(['driver' => 'sqlite', 'database' => ':memory:']);
})->with([
    'no inherited URL' => '',
    'SQLite file URL'  => 'sqlite:///database-that-must-never-be-opened.sqlite',
    'MySQL URL'        => 'mysql://synthetic:synthetic@127.0.0.1:1/database_that_must_never_be_opened',
]);
