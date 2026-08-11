<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\GrantPermissionRequest;
use App\Models\User;
use App\Services\PermissionManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

final class GrantPermissionController extends Controller
{
    public function __construct(
        private readonly PermissionManagementService $permissionManagementService
    ) {
    }

    public function __invoke(GrantPermissionRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('mutatePermissions', $user);

        $this->permissionManagementService->grantPermissionToUser(
            user: $user,
            permissionName: $request->validated('permission'),
            canImpersonateAny: $request->boolean('can_impersonate_any')
        );

        return back()->with('success', 'Permissão concedida com sucesso.');
    }
}
