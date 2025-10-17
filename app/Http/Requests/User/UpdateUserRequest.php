<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
        $userId = $this->route('user')?->id; // pastikan `{user}` di routes

        return [
            'name'        => ['required','string','max:255'],
            'email'       => ['required','string','email','max:255', Rule::unique('users','email')->ignore($userId)],
            'password'    => ['nullable','string','min:8','confirmed'],
            'rubrik_id'   => ['nullable','exists:rubriks,id'],
            'division_id' => ['nullable','exists:divisions,id'],
            // optional dari form edit profil:
            'role'               => ['nullable','string'],
            'direct_permissions' => ['array'],
            'direct_permissions.*' => ['string'],
        ];
    }
}
