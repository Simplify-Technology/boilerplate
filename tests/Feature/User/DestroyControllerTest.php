<?php

declare(strict_types = 1);

use App\Enum\Roles;

it('deletes a user and redirects to the index with a success flash', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->delete(route('users.destroy', $target))
        ->assertRedirect(route('users.index'))
        ->assertInertiaFlash('success');

    $this->assertDatabaseMissing('users', ['id' => $target->id]);
});

it('forbids deleting yourself', function(): void {
    $superUser = actingAsSuperUser();

    $this->delete(route('users.destroy', $superUser))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $superUser->id]);
});

it('forbids a non super user from deleting a super user', function(): void {
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::SUPER_USER);

    $this->delete(route('users.destroy', $target))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $target->id]);
});

it('forbids a user without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);
    $target = guestUser();

    $this->delete(route('users.destroy', $target))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $target->id]);
});
