<?php

namespace App\Http\Requests\Rubrik;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRubrikRequest extends FormRequest
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
        $id = $this->route('rubrik')?->id ?? $this->route('rubrik');
        return [
            'name' => ['required','string','max:150', Rule::unique('rubriks','name')->ignore($id)],
            'slug' => ['required','string','max:150', Rule::unique('rubriks','slug')->ignore($id)],
            'description' => ['nullable','string'],
        ];
    }
}
