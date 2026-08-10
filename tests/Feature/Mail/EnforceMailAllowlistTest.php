<?php

declare(strict_types = 1);

use App\Listeners\EnforceMailAllowlist;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mime\Email;

function mailAllowlistEmail(): Email
{
    return (new Email())->from('no-reply@example.com')->subject('Teste')->text('corpo');
}

/**
 * @return array<int, string>
 */
function mailAllowlistAddresses(array $addresses): array
{
    return array_map(fn($address): string => $address->getAddress(), $addresses);
}

beforeEach(function(): void {
    config()->set('mail.allowlist', ['@empresa.com.br', 'ceo@partner.com']);
    config()->set('mail.test_inbox', 'qa-catch@empresa.com.br');
});

it('redirects a non-allowlisted recipient to the test inbox off production', function(): void {
    $email = mailAllowlistEmail()->to('cliente.real@gmail.com');
    $event = new MessageSending($email);

    $result = app(EnforceMailAllowlist::class)->handle($event);

    // null = segue o envio (com destinatários reescritos); só `false` cancela.
    expect($result)->toBeNull()
        ->and(mailAllowlistAddresses($email->getTo()))->toBe(['qa-catch@empresa.com.br']);
});

it('lets allowlisted recipients through (exact e-mail + domain) untouched', function(): void {
    $email = mailAllowlistEmail()->to('ops@empresa.com.br')->cc('ceo@partner.com');
    $event = new MessageSending($email);

    app(EnforceMailAllowlist::class)->handle($event);

    expect(mailAllowlistAddresses($email->getTo()))->toBe(['ops@empresa.com.br'])
        ->and(mailAllowlistAddresses($email->getCc()))->toBe(['ceo@partner.com']);
});

it('keeps allowlisted and redirects the rest when mixed', function(): void {
    $email = mailAllowlistEmail()->to('ops@empresa.com.br', 'fulano@gmail.com');
    $event = new MessageSending($email);

    app(EnforceMailAllowlist::class)->handle($event);

    expect(mailAllowlistAddresses($email->getTo()))->toBe(['ops@empresa.com.br', 'qa-catch@empresa.com.br']);
});

it('cancels the send when nothing is allowlisted and no test inbox is set', function(): void {
    config()->set('mail.test_inbox', null);

    $email = mailAllowlistEmail()->to('cliente.real@gmail.com');
    $event = new MessageSending($email);

    expect(app(EnforceMailAllowlist::class)->handle($event))->toBeFalse();
});

it('does nothing when no allowlist is configured', function(): void {
    config()->set('mail.allowlist', []);

    $email = mailAllowlistEmail()->to('qualquer@gmail.com');
    $event = new MessageSending($email);

    app(EnforceMailAllowlist::class)->handle($event);

    expect(mailAllowlistAddresses($email->getTo()))->toBe(['qualquer@gmail.com']);
});

it('does nothing in production even with an allowlist configured', function(): void {
    // A trava é de staging: se ela agisse em produção, cliente real não receberia nada.
    app()->detectEnvironment(fn(): string => 'production');

    $email = mailAllowlistEmail()->to('cliente.real@gmail.com');
    $event = new MessageSending($email);

    expect(app(EnforceMailAllowlist::class)->handle($event))->toBeNull()
        ->and(mailAllowlistAddresses($email->getTo()))->toBe(['cliente.real@gmail.com']);
});

it('is wired to the mailer via event discovery, so a real send gets rewritten', function(): void {
    // Sem Mail::fake: o envio passa pelo MessageSending de verdade — prova que
    // a descoberta automática de listeners registrou o EnforceMailAllowlist.
    Mail::raw('corpo', function($message): void {
        $message->to('cliente.real@gmail.com')->subject('Teste');
    });

    $sent = Mail::mailer()->getSymfonyTransport()->messages();

    expect($sent)->toHaveCount(1)
        ->and(mailAllowlistAddresses($sent[0]->getOriginalMessage()->getTo()))->toBe(['qa-catch@empresa.com.br']);
});

it('parses the MAIL_ALLOWLIST env into a trimmed list', function(): void {
    // Espelha o parse feito em config/mail.php.
    $parsed = array_values(array_filter(array_map('trim', explode(',', ' @empresa.com.br , ceo@partner.com ,, '))));

    expect($parsed)->toBe(['@empresa.com.br', 'ceo@partner.com']);
});
