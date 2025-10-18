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
            'title'            => ['required','string','max:200'],
            'slug'             => ['nullable','string','max:200','unique:articles,slug'],
            'rubrik_id'        => ['nullable','exists:rubriks,id'],
            'excerpt'          => ['nullable','string'],
            'content'          => ['nullable','string'],
            'is_anonymous'     => ['boolean'],

            // meta + subkeys yg dipakai frontend
            'meta'                 => ['array'],
            'meta.keywords'        => ['sometimes','array'],
            'meta.keywords.*'      => ['string','max:64'],
            'meta.description'     => ['nullable','string','max:300'],
            'meta.cover_data_url'  => ['sometimes','string'], // data URL base64 dari UI
            'meta.cover_url'       => ['sometimes','string'],
            'meta.cover_path'      => ['sometimes','string'],
            'meta.hilos'           => ['sometimes','array'],  // highlight ranges/marks
        ];
    }
}
