<?php

namespace App\Http\Requests\Article;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Article;

class UpdateArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Article $article */
        $article = $this->route('article');
        return $this->user()?->can('update', $article) ?? false;
    }

    public function rules(): array
    {
        return [
            'title'            => ['required','string','max:200'],
            'slug'             => ['nullable','string','max:200','unique:articles,slug,' . optional($this->route('article'))->id],
            'rubrik_id'        => ['nullable','exists:rubriks,id'],
            'excerpt'          => ['nullable','string'],
            'content'          => ['nullable','string'],
            'is_anonymous'     => ['boolean'],

            'meta'                 => ['array'],
            'meta.keywords'        => ['sometimes','array'],
            'meta.keywords.*'      => ['string','max:64'],
            'meta.description'     => ['nullable','string','max:300'],
            'meta.cover_data_url'  => ['sometimes','string'],
            'meta.cover_url'       => ['sometimes','string'],
            'meta.cover_path'      => ['sometimes','string'],
            'meta.hilos'           => ['sometimes','array'], // highlight dari editor
        ];
    }
}
