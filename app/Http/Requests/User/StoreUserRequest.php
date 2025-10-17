<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage.users') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'        => ['required','string','max:255'],
            'email'       => ['required','string','email','max:255','unique:users,email'],
            'password'    => ['required','string','min:8','confirmed'],
            'rubrik_id'   => ['nullable','exists:rubriks,id'],
            'division_id' => ['nullable','exists:divisions,id'],
            // optional ketika create:
            'role'               => ['nullable','string'],
            'direct_permissions' => ['array'],
            'direct_permissions.*' => ['string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email sudah dipakai.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ];
    }
}
