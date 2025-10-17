<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class AssignUserRequest extends FormRequest
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
            'role' => ['required','string'], // exact role name
            'rubrik_id' => ['nullable','integer','exists:rubriks,id'],
            'division_id' => ['nullable','integer','exists:divisions,id'],
            'direct_permissions' => ['array'],
            'direct_permissions.*' => ['string'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            $role = strtolower((string) $this->input('role'));
            $needsRubrik = in_array($role, ['admin rubrik','editor rubrik'], true);
            if ($needsRubrik && !$this->filled('rubrik_id')) {
                $v->errors()->add('rubrik_id', 'Rubrik wajib dipilih untuk role ini.');
            }
            $mustNull = in_array($role, ['super admin','author'], true);
            if ($mustNull && $this->filled('rubrik_id')) {
                $v->errors()->add('rubrik_id', 'Role ini tidak boleh memiliki rubrik.');
            }
        });
    }

    // public function withValidator($validator)
    // {
    //     $validator->after(function ($v) {
    //         $role = $this->input('role');

    //         if (in_array($role, ['Admin Rubrik','Editor Rubrik'], true) && !$this->filled('rubrik_id')) {
    //             $v->errors()->add('rubrik_id', 'Rubrik wajib dipilih untuk role ' . $role . '.');
    //         }
    //         if (in_array($role, ['Super Admin','Author'], true) && $this->filled('rubrik_id')) {
    //             $v->errors()->add('rubrik_id', 'Rubrik harus kosong untuk role ' . $role . '.');
    //         }
    //     });
    // }
}
