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
            'title'      => ['required','string','max:255'],
            'rubrik_id'  => ['nullable','exists:rubriks,id'],
            'excerpt'    => ['nullable','string','max:500'],
            'content'    => ['nullable','string'],
            'meta'       => ['nullable','array'],
        ];
    }
}
