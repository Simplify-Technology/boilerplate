<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\GrantPermissionRequest;
use App\Models\User;
use App\Services\PermissionManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

final class GrantPermissionController extends Controller
{
    public function __construct(
        private readonly PermissionManagementService $permissionManagementService
    ) {
    }

    public function __invoke(GrantPermissionRequest $request, User $user): RedirectResponse
    {
        /** @var string $permissionName */
        $permissionName = $request->validated('permission');

        // Hoje o teto é vazio aqui — o `GrantPermissionRequest` só deixa passar
        // `super_user`, que compõe qualquer conjunto. Vai declarado assim mesmo
        // para que afrouxar aquele FormRequest não reabra o buraco em silêncio.
        Gate::authorize('mutatePermissions', [$user, [$permissionName]]);

        $this->permissionManagementService->grantPermissionToUser(
            user: $user,
            permissionName: $permissionName,
            canImpersonateAny: $request->boolean('can_impersonate_any')
        );

        Inertia::flash('success', 'Permissão concedida com sucesso.');

        return back();
    }
}
