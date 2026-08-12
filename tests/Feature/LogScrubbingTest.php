<?php

declare(strict_types = 1);

use App\Models\User;
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

// region Objeto no contexto
/*
 * `scrub()` tratava `array` e `string` e devolvia qualquer outra coisa intacta.
 * O objeto atravessava o processor sem ser tocado e só então o formatter do
 * Monolog o serializava — depois que a única defesa já tinha passado. As duas
 * camadas (chave e padrão) ficavam ATRÁS do formatter, e por isso vazava até o
 * CPF formatado, que a camada de padrão pegaria numa string comum.
 */

it('scrubs a model handed to the log context', function() {
    $user = User::factory()->create([
        'cpf_cnpj'   => '529.982.247-25',
        'phone'      => '(11) 98765-4321',
        'name'       => 'Fulana de Tal',
        'user_notes' => 'anotação interna do RH',
    ]);

    Log::channel('testing_scrub')->info('perfil atualizado', ['user' => $user]);

    $written = file_get_contents($this->logPath);

    expect($written)
        ->not->toContain('529.982.247-25')
        ->not->toContain('(11) 98765-4321')
        ->not->toContain('Fulana de Tal')
        ->not->toContain('anotação interna do RH')
        // O id continua no log: é o que serve para depurar.
        ->toContain((string) $user->id);
});

it('scrubs a collection handed to the log context', function() {
    Log::channel('testing_scrub')->info('lote', [
        'dados' => collect(['cpf' => '529.982.247-25', 'pedido' => 'abc-123']),
    ]);

    $written = file_get_contents($this->logPath);

    expect($written)
        ->not->toContain('529.982.247-25')
        ->toContain('abc-123');
});

// endregion
// region Chave composta

it('redacts a composite key whose value no pattern would catch', function() {
    /*
     * O caso que só a camada de CHAVE resolve: nome de pessoa e endereço livre
     * não têm assinatura de regex. Com igualdade exata, `user_name` e
     * `billing_address` passavam inteiros.
     */
    Log::channel('testing_scrub')->info('cadastro', [
        'user_name'       => 'Fulana de Tal',
        'billing_address' => 'Praça da Sé, 100, apto 42',
    ]);

    $written = file_get_contents($this->logPath);

    expect($written)
        ->not->toContain('Fulana de Tal')
        ->not->toContain('Praça da Sé');
});

it('keeps operational keys that merely contain an ambiguous word', function() {
    /*
     * O outro lado, e o motivo de a lista ser dividida em duas: casar `name`,
     * `rg`, `auth` ou `session` por substring apagaria metade do log útil deste
     * repositório — o RBAC registra `role_name` e `permission_name` o tempo
     * todo, e `organization` contém `rg`.
     */
    Log::channel('testing_scrub')->info('operação', [
        'role_name'       => 'manager',
        'permission_name' => 'manage_users',
        'file_name'       => 'relatorio.pdf',
        'organization'    => 'acme',
        'author'          => 'sistema',
        'session_count'   => 3,
        // `exception` CONTÉM "cep" — casar `cep` por substring apagaria a
        // classe do erro em todo log de falha. Achado da auditoria de termos,
        // e o motivo de `cep` ficar na lista exata.
        'exception' => 'InvalidArgumentException',
    ]);

    $written = file_get_contents($this->logPath);

    expect($written)
        ->toContain('manager')
        ->toContain('manage_users')
        ->toContain('relatorio.pdf')
        ->toContain('acme')
        ->toContain('sistema')
        ->toContain('InvalidArgumentException');
});

it('still redacts the exact ambiguous keys', function() {
    // `name` sozinho é o nome do titular; `session` sozinho é o identificador.
    Log::channel('testing_scrub')->info('titular', [
        'name'    => 'Fulana de Tal',
        'session' => 'abcdef123456',
        'auth'    => 'algum-segredo',
    ]);

    $written = file_get_contents($this->logPath);

    expect($written)
        ->not->toContain('Fulana de Tal')
        ->not->toContain('abcdef123456')
        ->not->toContain('algum-segredo');
});

// endregion
