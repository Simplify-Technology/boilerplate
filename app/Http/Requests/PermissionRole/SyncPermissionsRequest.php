<?php

declare(strict_types = 1);

namespace App\Http\Requests\PermissionRole;

use App\Enum\Permissions;
use Illuminate\Foundation\Http\FormRequest;

final class SyncPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(Permissions::MANAGE_USERS) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['required', 'exists:permissions,name'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'permissions.array'      => 'O campo permissões deve ser uma lista.',
            'permissions.*.required' => 'Cada permissão é obrigatória.',
            'permissions.*.exists'   => 'A permissão selecionada não existe.',
        ];
    }
}
