<?php

namespace App\Http\Requests\Division;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDivisionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage.divisions') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->route('division')?->id ?? $this->route('division');
        return [
            'name' => ['required','string','max:150', Rule::unique('divisions','name')->ignore($id)],
            'slug' => ['required','string','max:150', Rule::unique('divisions','slug')->ignore($id)],
            'description' => ['nullable','string'],
        ];
    }
}
