<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Article\StoreArticleRequest;
use App\Http\Requests\Article\UpdateArticleRequest;
use App\Models\Article;
use App\Models\ArticleReview;
use App\Models\Rubrik;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthorArticlesController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $articles = Article::query()
            ->owned($user->id)
            ->with('rubrik:id,name')
            ->latest('updated_at')
            ->get(['id','title','slug','status','rubrik_id','updated_at','created_at']);

        return Inertia::render('admin/articles/index', [
            'articles' => $articles->map(fn(Article $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'slug' => $a->slug,
                'status' => $a->status,
                'rubrik' => $a->rubrik?->name,
                'updated_at' => optional($a->updated_at)?->toDateTimeString(),
                'created_at' => optional($a->created_at)?->toDateTimeString(),
            ]),
            'statuses' => Article::labels(),
            'rubriks'  => Rubrik::orderBy('name')->get(['id','name']),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/articles/create', [
            'rubriks' => Rubrik::orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(StoreArticleRequest $request)
    {
        $user = $request->user();

        $article = Article::create([
            'author_id' => $user->id,
            'rubrik_id' => $request->input('rubrik_id'),
            'title'     => $request->input('title'),
            'excerpt'   => $request->input('excerpt'),
            'content'   => $request->input('content'),
            'status'    => Article::ST_DRAFT, // default draft
            'meta'      => $request->input('meta', []),
        ]);

        return to_route('admin.articles.index')->with('success','Draft created.');
    }

    public function edit(Article $article)
    {
        $this->authorize('update', $article);

        return Inertia::render('admin/articles/edit', [
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'status' => $article->status,
                'rubrik_id' => $article->rubrik_id,
                'excerpt' => $article->excerpt,
                'content' => $article->content,
            ],
            'rubriks' => Rubrik::orderBy('name')->get(['id','name']),
        ]);
    }

    public function update(UpdateArticleRequest $request, Article $article)
    {
        $article->update($request->validated());

        // Jika author menekan "Save", tetap di draft/revision; submit di route terpisah
        return back()->with('success','Article saved.');
    }

    public function show(Article $article)
    {
        $this->authorize('view', $article);

        return Inertia::render('admin/articles/show', [
            'article' => [
                'id'      => $article->id,
                'title'   => $article->title,
                'slug'    => $article->slug,
                'status'  => $article->status,
                'rubrik'  => $article->rubrik?->name,
                'excerpt' => $article->excerpt,
                'content' => $article->content,
                'published_at' => optional($article->published_at)?->toDateTimeString(),
            ],
            'labels' => Article::labels(),
        ]);
    }

    public function destroy(Article $article)
    {
        $this->authorize('delete', $article);
        $article->delete();
        return to_route('admin.articles.index')->with('success','Draft deleted.');
    }

    public function submit(Request $request, Article $article)
    {
        $this->authorize('submit', $article);

        $from = $article->status;
        $article->status = Article::ST_SUBMITTED;
        $article->save();

        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'submit',
            'from_status' => $from,
            'to_status'   => Article::ST_SUBMITTED,
            'note'        => $request->input('note'),
        ]);

        return to_route('admin.articles.index')->with('success','Article submitted.');
    }
}
