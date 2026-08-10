<?php

declare(strict_types = 1);

use App\Support\Logging\PiiAwareTap;
use App\Support\Logging\PiiScrubber;
use Illuminate\Support\Facades\Log;

beforeEach(function() {
    $this->logPath = storage_path('logs/testing-scrub.log');

    // Espelha o canal `single` de produção (tap + replace_placeholders).
    config()->set('logging.channels.testing_scrub', [
        'driver'               => 'single',
        'path'                 => $this->logPath,
        'level'                => 'debug',
        'replace_placeholders' => true,
        'tap'                  => [PiiAwareTap::class],
    ]);
});

afterEach(function() {
    if (file_exists($this->logPath)) {
        unlink($this->logPath);
    }
});

it('scrubs pii out of what actually reaches the log file', function() {
    Log::channel('testing_scrub')->warning(
        'reset solicitado por fulano@example.com no telefone (11) 98765-4321, cep 01001-000',
        [
            'cpf'      => '529.982.247-25',
            'cnpj'     => '12.345.678/0001-95',
            'endereco' => ['rua' => 'Praça da Sé', 'cep' => '01001-000'],
            'jwt'      => 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc-def_123',
            'order_id' => 'abc-123',
        ]
    );

    $written = file_get_contents($this->logPath);

    expect($written)
        ->not->toContain('fulano@example.com')
        ->not->toContain('(11) 98765-4321')
        ->not->toContain('01001-000')
        ->not->toContain('529.982.247-25')
        ->not->toContain('12.345.678/0001-95')
        ->not->toContain('eyJhbGciOiJIUzI1NiJ9')
        ->toContain('[EMAIL]')
        ->toContain('[PHONE]')
        ->toContain('[CEP]')
        ->toContain(PiiScrubber::REDACTED)
        // O que serve para depurar continua no log.
        ->toContain('abc-123');
});

it('keeps the shipped channels wired to the scrubber', function(string $channel) {
    expect(config("logging.channels.{$channel}.tap"))->toContain(PiiAwareTap::class);
})->with(['single', 'daily', 'stack']);
