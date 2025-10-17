<?php

namespace App\Http\Requests\Article;

use Illuminate\Foundation\Http\FormRequest;

class StoreArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Article::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'title'      => ['required','string','max:255'],
            'rubrik_id'  => ['nullable','exists:rubriks,id'],
            'excerpt'    => ['nullable','string','max:500'],
            'content'    => ['nullable','string'],
            'meta'       => ['nullable','array'],
        ];
    }
}
