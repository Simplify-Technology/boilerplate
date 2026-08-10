<?php

declare(strict_types = 1);

namespace Database\Seeders\Concerns;

use RuntimeException;

/**
 * Guards demo seeders (trivial dev passwords + fake data) from ever running
 * against a production database.
 *
 * `php artisan db:seed` is common in git-based deploy flows; without this
 * guard it would plant `super@user.com` / `password` straight into prod.
 * Demo seeding is allowed only in `local`/`testing`, or when an operator
 * explicitly opts in with `SEED_DEMO=true` **and** supplies
 * `SEED_ADMIN_PASSWORD` — the well-known `password` fallback is never
 * reachable outside `local`/`testing`.
 *
 * @property \Illuminate\Console\Command|null $command
 */
trait GuardsDemoSeeding
{
    /**
     * Whether demo data may be seeded in the current environment.
     */
    protected function demoSeedingAllowed(): bool
    {
        if (app()->environment('local', 'testing')) {
            return true;
        }

        // @phpstan-ignore larastan.noEnvCallsOutsideOfConfig (opt-in de deploy lido do ambiente do processo de propósito, sem chave de config)
        return filter_var(env('SEED_DEMO', false), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Early-return helper for a seeder's `run()`: warns and returns `false`
     * when demo seeding is not allowed, so the caller can bail with
     * `if (! $this->guardDemoSeeding()) { return; }`.
     */
    protected function guardDemoSeeding(): bool
    {
        if ($this->demoSeedingAllowed()) {
            return true;
        }

        $this->command?->warn(sprintf(
            '[seed] %s skipped: demo data is not seeded outside local/testing (set SEED_DEMO=true to force).',
            class_basename(static::class),
        ));

        return false;
    }

    /**
     * Password for seeded demo users. Never hardcodes a secret that could
     * reach prod: `SEED_ADMIN_PASSWORD` wins when set; the well-known
     * `password` is used only in `local`/`testing`. Outside those, seeding
     * was explicitly opted into (`SEED_DEMO`), so a real password is
     * mandatory and its absence is a hard failure.
     */
    protected function demoSeedPassword(): string
    {
        // @phpstan-ignore larastan.noEnvCallsOutsideOfConfig (segredo de deploy lido do ambiente do processo de propósito, sem chave de config)
        $configured = env('SEED_ADMIN_PASSWORD');

        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        if (app()->environment('local', 'testing')) {
            return 'password';
        }

        throw new RuntimeException(
            'SEED_ADMIN_PASSWORD is required to seed demo users outside local/testing.',
        );
    }
}
