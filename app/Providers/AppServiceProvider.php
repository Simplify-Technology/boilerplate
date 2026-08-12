<?php

declare(strict_types = 1);

namespace App\Providers;

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\User;
use App\Policies\UserPolicy;
use App\Resolvers\ActivityCauserResolver;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\MissingAttributeException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\LazyLoadingViolationException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Opcodes\LogViewer\Facades\LogViewer;
use RuntimeException;
use Spatie\Activitylog\Support\CauserResolver;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->setupLogViewer();
        $this->configModels();
        $this->configRateLimiting();
        $this->configCommands();
        $this->configUrls();
        $this->configDate();
        $this->configActivitylog();
        $this->configGates();
        $this->configPolicies();
        $this->configResources();

        $this->getComposer();
    }

    private function setupLogViewer(): void
    {
        LogViewer::auth(fn($request) => $request->user()?->hasRole(Roles::SUPER_USER));
    }

    private function configModels(): void
    {
        // Estrito em todos os ambientes; em produção as três violações são
        // reportadas (error tracker/log) em vez de estourar 500 ou, pior,
        // descartar dados silenciosamente.
        Model::shouldBeStrict();

        if (app()->isProduction()) {
            Model::handleLazyLoadingViolationUsing(
                static function(Model $model, string $relation): void {
                    report(new LazyLoadingViolationException($model, $relation));
                }
            );

            Model::handleMissingAttributeViolationUsing(
                static function(Model $model, string $key) {
                    report(new MissingAttributeException($model, $key));

                    return null;
                }
            );

            Model::handleDiscardedAttributeViolationUsing(
                static function(Model $model, array $keys): void {
                    report(new RuntimeException(sprintf(
                        'Atributos [%s] descartados fora do fillable em %s.',
                        implode(', ', $keys),
                        $model::class
                    )));
                }
            );
        }
    }

    private function configRateLimiting(): void
    {
        RateLimiter::for(
            'auth',
            static fn(Request $request): Limit => Limit::perMinute(10)->by($request->ip())
        );

        RateLimiter::for(
            'impersonate',
            static fn(Request $request): Limit => Limit::perMinute(10)->by($request->user()->id ?? $request->ip())
        );

        RateLimiter::for(
            'verification',
            static fn(Request $request): Limit => Limit::perMinute(6)->by($request->user()->id ?? $request->ip())
        );

        /*
         * `POST confirm-password` valida a senha do próprio usuário e não tinha
         * teto nenhum: nem aqui, nem no controller — ao contrário do login, que
         * carrega o dele no `LoginRequest`. É o MESMO segredo, e a tela existe
         * justamente porque "estar logado" não basta para o que vem depois
         * dela; sem limite, quem chega a uma sessão alheia chuta a senha do
         * dono à vontade até abrir as áreas sensíveis.
         *
         * Chave por usuário, como `impersonate` e `verification`: a rota já
         * exige autenticação, e chavear por IP trancaria colegas atrás do mesmo
         * NAT para fora dessas áreas.
         */
        RateLimiter::for(
            'password-confirmation',
            static fn(Request $request): Limit => Limit::perMinute(6)->by($request->user()->id ?? $request->ip())
        );
    }

    private function configCommands(): void
    {
        DB::prohibitDestructiveCommands(
            app()->isProduction()
        );
    }

    private function configUrls(): void
    {
        if (app()->isProduction()) {
            URL::forceHttps();
        }
    }

    private function configDate(): void
    {
        Date::use(CarbonImmutable::class);
    }

    private function configActivitylog(): void
    {
        app(CauserResolver::class)->resolveUsing(
            static fn(): ?Model => ActivityCauserResolver::resolve()
        );
    }

    private function configGates(): void
    {
        foreach (Permissions::cases() as $permission) {
            Gate::define(
                $permission->value,
                function($user) use ($permission) {
                    if (!$user) {
                        return false;
                    }

                    return $user->hasPermissionTo($permission->value);
                }
            );
        }
    }

    private function configPolicies(): void
    {
        Gate::policy(User::class, UserPolicy::class);
    }

    private function configResources(): void
    {
        JsonResource::withoutWrapping();
    }

    public function getComposer(): void
    {
        View::composer('*', function($view): void {
            if (Auth::check()) {
                $user = Auth::user()->load(['permissions', 'role']);
                $view->with('auth', [
                    'user'        => $user,
                    'role'        => $user->role?->name,
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ]);
            } else {
                $view->with('auth', ['user' => null, 'role' => null, 'permissions' => []]);
            }
        });
    }
}
