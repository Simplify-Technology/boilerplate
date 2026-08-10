<?php

namespace App\Http\Requests\User;

use App\Enum\Roles as RolesEnum;
use App\Models\User;
use App\Rules\CpfCnpj;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage_users');
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
            'name'  => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                'unique:' . User::class,
            ],
            'cpf_cnpj' => ['nullable', 'string', new CpfCnpj()],
            'phone'    => ['nullable', 'string', 'max:20'],
            'mobile'   => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role_id'  => [
                'nullable',
                Rule::exists('roles', 'id')->whereIn('name', $allowedRoleNames),
            ],
            'is_active'  => ['sometimes', 'boolean'],
            'user_notes' => ['nullable', 'string', 'max:65535'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'O nome é obrigatório.',
            'email.required'     => 'O email é obrigatório.',
            'email.unique'       => 'Este email já está em uso.',
            'password.required'  => 'A senha é obrigatória.',
            'password.confirmed' => 'A confirmação de senha não confere.',
            'role_id.exists'     => 'O cargo selecionado é inválido.',
        ];
    }
}
