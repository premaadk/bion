<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ArticleReview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class ArticleApprovalController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Filter list berdasarkan role & rubrik
        $query = Article::query()->with('rubrik:id,name','author:id,name');

        if ($user->hasRole('Super Admin')) {
            // bisa lihat semuanya (kecuali draft author lain, tidak diminta)
            $query->whereIn('status', [
                Article::ST_SUBMITTED,
                Article::ST_REVIEW_EDITOR,
                Article::ST_REVISION,
                Article::ST_REVISED,
                Article::ST_APPROVED,
                Article::ST_REVIEW_ADMIN,
                Article::ST_REJECTED,
                Article::ST_PUBLISHED,
            ]);
        } elseif ($user->hasRole('Editor Rubrik')) {
            $query->sameRubrikAs($user->rubrik_id)
                  ->whereIn('status', [
                      Article::ST_SUBMITTED, Article::ST_REVIEW_EDITOR, Article::ST_REVISION, Article::ST_APPROVED
                  ]);
        } elseif ($user->hasRole('Admin Rubrik')) {
            $query->sameRubrikAs($user->rubrik_id)
                  ->whereIn('status', [
                      Article::ST_SUBMITTED, Article::ST_APPROVED, Article::ST_REVIEW_ADMIN
                  ]);
        } else {
            // bukan reviewer
            $query->whereRaw('1=0');
        }

        $rows = $query->latest('updated_at')->get([
            'id','title','slug','status','rubrik_id','author_id','updated_at','created_at'
        ]);

        return Inertia::render('admin/articles/manage/index', [
            'articles' => $rows->map(fn(Article $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'status' => $a->status,
                'rubrik' => $a->rubrik?->name,
                'author' => $a->author?->name,
                'updated_at' => optional($a->updated_at)?->toDateTimeString(),
            ]),
            'labels' => Article::labels(),
        ]);
    }

    public function show(Article $article)
    {
        Gate::authorize('view', $article);

        return Inertia::render('admin/articles/manage/show', [
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'status' => $article->status,
                'rubrik' => $article->rubrik?->name,
                'author' => $article->author?->name,
                'excerpt' => $article->excerpt,
                'content' => $article->content,
                'published_at' => optional($article->published_at)?->toDateTimeString(),
            ],
            'labels' => Article::labels(),
        ]);
    }

    // ===== Editor Actions =====
    public function startEditorReview(Request $request, Article $article)
    {
        Gate::authorize('reviewAsEditor', $article);

        $from = $article->status;
        $article->status = Article::ST_REVIEW_EDITOR;
        $article->save();

        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'review_editor',
            'from_status' => $from,
            'to_status'   => Article::ST_REVIEW_EDITOR,
            'note'        => $request->input('note'),
        ]);

        return back()->with('success','Article set to Review by Editor.');
    }

    public function requestRevision(Request $request, Article $article)
    {
        Gate::authorize('requestRevision', $article);

        $from = $article->status;
        $article->status = Article::ST_REVISION;
        $article->save();

        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'request_revision',
            'from_status' => $from,
            'to_status'   => Article::ST_REVISION,
            'note'        => $request->input('note'),
        ]);

        return back()->with('success','Revision requested to author.');
    }

    public function approve(Request $request, Article $article)
    {
        Gate::authorize('approve', $article);

        $from = $article->status;
        $article->status = Article::ST_APPROVED;
        $article->save();

        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'approve',
            'from_status' => $from,
            'to_status'   => Article::ST_APPROVED,
            'note'        => $request->input('note'),
        ]);

        return back()->with('success','Article approved by editor.');
    }

    // ===== Admin Actions =====
    public function startAdminReview(Request $request, Article $article)
    {
        Gate::authorize('reviewAsAdmin', $article);

        $from = $article->status;
        $article->status = Article::ST_REVIEW_ADMIN;
        $article->save();

        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'review_admin',
            'from_status' => $from,
            'to_status'   => Article::ST_REVIEW_ADMIN,
            'note'        => $request->input('note'),
        ]);

        return back()->with('success','Article set to Review by Admin.');
    }

    public function reject(Request $request, Article $article)
    {
        Gate::authorize('reject', $article);

        $from = $article->status;
        $article->status = Article::ST_REJECTED;
        $article->save();

        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'reject',
            'from_status' => $from,
            'to_status'   => Article::ST_REJECTED,
            'note'        => $request->input('note'),
        ]);

        return back()->with('success','Article rejected.');
    }

    public function publish(Request $request, Article $article)
    {
        Gate::authorize('publish', $article);

        $from = $article->status;
        $article->status = Article::ST_PUBLISHED;
        $article->published_at = now();
        $article->save();

        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'publish',
            'from_status' => $from,
            'to_status'   => Article::ST_PUBLISHED,
            'note'        => $request->input('note'),
        ]);

        return back()->with('success','Article published.');
    }
}
