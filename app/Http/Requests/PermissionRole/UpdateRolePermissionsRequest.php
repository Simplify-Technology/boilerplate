<?php

declare(strict_types = 1);

namespace App\Http\Requests\PermissionRole;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage_roles') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'permissions'   => ['present', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'permissions.present'  => 'O campo permissões deve estar presente.',
            'permissions.array'    => 'O campo permissões deve ser uma lista.',
            'permissions.*.string' => 'Cada permissão deve ser um texto.',
            'permissions.*.exists' => 'A permissão selecionada não existe.',
        ];
    }
}
