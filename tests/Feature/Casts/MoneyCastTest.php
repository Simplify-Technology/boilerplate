<?php

declare(strict_types = 1);

use App\Casts\MoneyCast;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Model fictício apenas para exercitar o MoneyCast contra uma coluna decimal.
 */
final class MoneyCastFixtureModel extends Model
{
    public $timestamps = false;

    protected $table = 'money_cast_fixture_models';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'amount' => MoneyCast::class,
        ];
    }
}

beforeEach(function(): void {
    if (!Schema::hasTable('money_cast_fixture_models')) {
        Schema::create('money_cast_fixture_models', function(Blueprint $table): void {
            $table->id();
            $table->decimal('amount', 12, 2)->nullable();
        });
    }
});

it('stores Money as decimal string and retrieves the same value', function(): void {
    $model = MoneyCastFixtureModel::query()->create([
        'amount' => Money::fromCents(123456),
    ]);

    $fresh = MoneyCastFixtureModel::query()->findOrFail($model->id);

    expect($fresh->amount)->toBeInstanceOf(Money::class)
        ->and($fresh->amount->cents())->toBe(123456)
        ->and((string) $fresh->getRawOriginal('amount'))->toBe('1234.56');
});

it('accepts validated decimal strings when setting', function(): void {
    $model = MoneyCastFixtureModel::query()->create([
        'amount' => '10.50',
    ]);

    expect($model->refresh()->amount?->cents())->toBe(1050);
});

it('round-trips null amounts', function(): void {
    $model = MoneyCastFixtureModel::query()->create([
        'amount' => null,
    ]);

    expect($model->refresh()->amount)->toBeNull();
});

it('rejects floats and other unsupported types', function(): void {
    expect(fn() => MoneyCastFixtureModel::query()->create([
        'amount' => 12.5,
    ]))->toThrow(InvalidArgumentException::class);
});
