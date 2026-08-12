<?php

declare(strict_types = 1);

use App\Support\Listing\ListQueryNormalizer;

/*
|--------------------------------------------------------------------------
| Ordenação e paginação vindas da URL são entrada NÃO CONFIÁVEL.
|--------------------------------------------------------------------------
|
| Direção fora de asc/desc faz Query\Builder::orderBy() lançar
| InvalidArgumentException ("Order direction must be a SortDirection, ...") —
| ou seja, 500 alcançável por querystring. Page size sem teto puxa a tabela
| inteira num request. Estes testes travam o fallback dos dois.
|
*/

describe('sortField', function(): void {
    it('mantém um campo da allow-list', function(): void {
        expect(ListQueryNormalizer::sortField('name', ['name', 'email'], 'created_at'))->toBe('name');
    });

    it('cai no default para campo fora da allow-list', function(): void {
        expect(ListQueryNormalizer::sortField('senha', ['name', 'email'], 'created_at'))->toBe('created_at');
    });

    it('cai no default para tipo que não é string', function(mixed $value): void {
        expect(ListQueryNormalizer::sortField($value, ['name'], 'created_at'))->toBe('created_at');
    })->with([
        'array' => [['name']],
        'null'  => [null],
        'int'   => [1],
        'bool'  => [true],
    ]);

    it('não casa campo por variação de caixa', function(): void {
        expect(ListQueryNormalizer::sortField('NAME', ['name'], 'created_at'))->toBe('created_at');
    });
});

describe('direction', function(): void {
    it('mantém as duas direções válidas', function(string $value): void {
        expect(ListQueryNormalizer::direction($value))->toBe($value);
    })->with(['asc', 'desc']);

    it('normaliza a caixa e o espaço em volta', function(): void {
        expect(ListQueryNormalizer::direction(' ASC '))->toBe('asc')
            ->and(ListQueryNormalizer::direction('Desc'))->toBe('desc');
    });

    it('cai no default para qualquer coisa que não seja asc ou desc', function(mixed $value): void {
        expect(ListQueryNormalizer::direction($value))->toBe('desc');
    })->with([
        'lixo'          => ['ordem-aleatoria'],
        'fragmento sql' => ['asc, (select 1)'],
        'vazio'         => [''],
        'array'         => [['asc']],
        'null'          => [null],
        'int'           => [1],
    ]);

    it('respeita o default declarado quando a entrada é inválida', function(): void {
        expect(ListQueryNormalizer::direction('lixo', 'asc'))->toBe('asc');
    });

    it('não deixa um default inválido reintroduzir a direção crua', function(): void {
        expect(ListQueryNormalizer::direction('lixo', 'ordem-aleatoria'))->toBe('desc');
    });
});

describe('perPage', function(): void {
    it('mantém um valor dentro da faixa', function(): void {
        expect(ListQueryNormalizer::perPage(25))->toBe(25);
    });

    it('aceita numérico em string, como vem da querystring', function(): void {
        expect(ListQueryNormalizer::perPage('25'))->toBe(25);
    });

    it('aplica o teto', function(mixed $value): void {
        expect(ListQueryNormalizer::perPage($value))->toBe(ListQueryNormalizer::PER_PAGE_MAX);
    })->with([
        'absurdo'   => [999_999],
        'em string' => ['999999'],
    ]);

    it('aplica o piso', function(mixed $value): void {
        expect(ListQueryNormalizer::perPage($value))->toBe(ListQueryNormalizer::PER_PAGE_MIN);
    })->with([
        'zero'     => [0],
        'negativo' => [-10],
    ]);

    it('cai no default para entrada não numérica', function(mixed $value): void {
        expect(ListQueryNormalizer::perPage($value))->toBe(15);
    })->with([
        'texto' => ['muitos'],
        'array' => [[50]],
        'null'  => [null],
        'vazio' => [''],
    ]);

    it('respeita o default declarado', function(): void {
        expect(ListQueryNormalizer::perPage('muitos', 20))->toBe(20);
    });
});
