<?php

declare(strict_types = 1);

use App\Http\Controllers\PermissionRole;
use App\Http\Controllers\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function(): void {
    Route::get('dashboard', function() {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Impersonate routes (must be before users routes to avoid conflicts)
    Route::delete('users/impersonate', User\StopImpersonateController::class)
        ->name('users.impersonate.stop');

    // region Users
    Route::middleware('can:manage_users')->group(function(): void {
        Route::get('users', User\IndexController::class)->name('users.index');
        Route::get('users/create', User\CreateController::class)->name('users.create');
        Route::post('users', User\StoreController::class)->name('users.store');
        Route::get('users/{user}', User\ShowController::class)->name('users.show');
        Route::get('users/{user}/edit', User\EditController::class)->name('users.edit');
        Route::put('users/{user}', User\UpdateController::class)->name('users.update');
        Route::delete('users/{user}', User\DestroyController::class)->name('users.destroy');
        Route::patch('users/{user}/toggle-active', User\ToggleActiveController::class)->name('users.toggle-active');

        // User Permissions
        Route::get('users/{user}/permissions', User\ShowUserPermissionsController::class)->name('users.permissions.show');
        Route::post('users/{user}/permissions/grant', User\GrantPermissionController::class)->name('users.permissions.grant');
        Route::delete('users/{user}/permissions/{permission}', User\RevokePermissionController::class)->name('users.permissions.revoke');
    });

    // Impersonate start route (after users routes but specific enough)
    Route::post('users/{user}/impersonate', User\StartImpersonateController::class)
        ->middleware(['throttle:impersonate', 'can:impersonate_users'])
        ->name('users.impersonate');

    // endregion
    // region Permissions and Roles
    Route::middleware('can:manage_roles')->group(function(): void {
        Route::redirect('/permissions', '/permissions/roles');
        Route::get(
            '/permissions/roles',
            PermissionRole\IndexController::class
        )->name('role-permissions');
        Route::put(
            '/permissions/roles/{role}',
            PermissionRole\UpdateController::class
        )->name('roles-permissions.update');
    });

    Route::middleware('can:assign_roles')->group(function(): void {
        Route::post('/users/{user}/assign-role', PermissionRole\AssignRoleController::class)->name('user.assign-role');
        Route::delete('/users/{user}/revoke-role', PermissionRole\RevokeRoleController::class)->name('user.revoke-role');
    });
    Route::post('/users/{user}/sync-permissions', PermissionRole\SyncPermissionsController::class)
        ->middleware('can:manage_users')
        ->name('user.sync-permissions');
    // endregion
});

require __DIR__ . '/settings.php';

require __DIR__ . '/auth.php';
