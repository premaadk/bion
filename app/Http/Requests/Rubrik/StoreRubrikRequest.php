<?php

namespace App\Http\Requests\Rubrik;

use Illuminate\Foundation\Http\FormRequest;

class StoreRubrikRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage.rubriks') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required','string','max:150','unique:rubriks,name'],
            'slug' => ['required','string','max:150','unique:rubriks,slug'],
            'description' => ['nullable','string'],
        ];
    }
}
