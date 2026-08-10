<?php

declare(strict_types = 1);

namespace App\Http\Requests\PermissionRole;

use App\Enum\Permissions;
use App\Enum\Roles as RolesEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class AssignRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(Permissions::ASSIGN_ROLES) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $allowedRoleNames = array_map(
            static fn(RolesEnum $role) => $role->value,
            RolesEnum::cases()
        );

        return [
            'role' => ['required', 'exists:roles,name', Rule::in($allowedRoleNames)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'role.required' => 'O cargo é obrigatório.',
            'role.exists'   => 'O cargo selecionado não existe.',
            'role.in'       => 'O cargo selecionado é inválido.',
        ];
    }
}
