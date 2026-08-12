<?php

declare(strict_types = 1);

use App\Enum\Roles;

it('deactivates an active user and redirects back with a success flash', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->from(route('users.index'))
        ->patch(route('users.toggle-active', $target))
        ->assertRedirect(route('users.index'))
        ->assertInertiaFlash('success');

    $this->assertDatabaseHas('users', ['id' => $target->id, 'is_active' => false]);
});

it('reactivates an inactive user', function(): void {
    actingAsSuperUser();
    $target = guestUser();
    $target->forceFill(['is_active' => false])->save();

    $this->patch(route('users.toggle-active', $target))->assertRedirect();

    $this->assertDatabaseHas('users', ['id' => $target->id, 'is_active' => true]);
});

it('forbids toggling your own status', function(): void {
    $superUser = actingAsSuperUser();

    $this->patch(route('users.toggle-active', $superUser))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $superUser->id, 'is_active' => true]);
});

it('forbids a user without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);
    $target = guestUser();

    $this->patch(route('users.toggle-active', $target))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $target->id, 'is_active' => true]);
});
