<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ArticleReview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class ArticleApprovalController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $rubrikId = $request->integer('rubrik_id');

        $query = Article::query()->with('rubrik:id,name','author:id,name');

        if ($user->hasRole('Super Admin')) {
            // bisa semua status
            $query->whereIn('status', [
                Article::ST_SUBMITTED, Article::ST_REVIEW_EDITOR, Article::ST_REVISION,
                Article::ST_REVISED, Article::ST_APPROVED, Article::ST_REVIEW_ADMIN,
                Article::ST_REJECTED, Article::ST_PUBLISHED,
            ]);
            if ($rubrikId) $query->where('rubrik_id', $rubrikId);
            $rubriks = \App\Models\Rubrik::orderBy('name')->get(['id','name']);
        } elseif ($user->hasRole('Editor Rubrik')) {
            $query->sameRubrikAs($user->rubrik_id)
                ->whereIn('status', [Article::ST_SUBMITTED, Article::ST_REVIEW_EDITOR, Article::ST_REVISION, Article::ST_APPROVED]);
            $rubriks = \App\Models\Rubrik::where('id', $user->rubrik_id)->get(['id','name']);
        } elseif ($user->hasRole('Admin Rubrik')) {
            $query->sameRubrikAs($user->rubrik_id)
                ->whereIn('status', [Article::ST_SUBMITTED, Article::ST_APPROVED, Article::ST_REVIEW_ADMIN]);
            $rubriks = \App\Models\Rubrik::where('id', $user->rubrik_id)->get(['id','name']);
        } else {
            $query->whereRaw('1=0');
            $rubriks = collect();
        }

        $rows = $query->latest('updated_at')->get([
            'id','title','slug','status','rubrik_id','author_id','updated_at','is_anonymous','meta'
        ]);

        return Inertia::render('admin/articles/index', [
            'articles' => $rows->map(fn(Article $a) => [
                'id'         => $a->id,
                'title'      => $a->title,
                'status'     => $a->status,
                'rubrik'     => $a->rubrik?->name,
                'author'     => $a->is_anonymous ? ('Anonim ('.$a->author?->name.')') : $a->author?->name,
                'updated_at' => optional($a->updated_at)?->toDateTimeString(),
                'cover_url'  => (array)($a->meta)['cover_url'] ?? null,
            ]),
            'labels'  => Article::labels(),
            'rubriks' => $rubriks->values(),
            'filters' => ['rubrik_id' => $rubrikId ?: null],
        ]);
    }

    public function show(Article $article, Request $request)
    {
        Gate::authorize('view', $article);

        // Muat relasi yang diperlukan (rubrik, author, reviews+actor) sekali query.
        $article->load([
            'rubrik:id,name',
            'author:id,name',
            // HANYA review milik artikel ini (via relasi), urut terbaru
            'reviews' => fn ($q) => $q->latest('created_at')->with('actor:id,name'),
        ]);

        // Normalisasi meta → pastikan cover_url selalu ada (fallback dari cover_path di public disk)
        $meta = (array) ($article->meta ?? []);
        $coverUrl  = $meta['cover_url']  ?? null;
        $coverPath = $meta['cover_path'] ?? null;
        if (!$coverUrl && $coverPath) {
            $coverUrl = Storage::disk('public')->url($coverPath);
        }

        // Build payload artikel untuk FE
        $payload = [
            'id'            => $article->id,
            'title'         => $article->title,
            'status'        => $article->status,
            'rubrik'        => $article->rubrik?->name,
            'author'        => $article->author?->name,
            'excerpt'       => $article->excerpt,
            'content'       => $article->content, // Quill HTML (termasuk stabilo)
            'published_at'  => optional($article->published_at)?->toDateTimeString(),
            'is_anonymous'  => (bool) $article->is_anonymous,
            'meta'          => [
                'cover_url'   => $coverUrl,
                'cover_path'  => $coverPath,
                'keywords'    => array_values((array) ($meta['keywords'] ?? [])),
            ],
        ];

        // RIWAYAT: strictly scoped to THIS article via relasi di atas
        $reviews = $article->reviews->map(fn ($r) => [
            'id'         => $r->id,
            'action'     => $r->action,                 // submit / review_editor / request_revision / approve / ...
            'note'       => $r->note,
            'actor'      => optional($r->actor)->name,  // nama pemberi catatan
            'created_at' => optional($r->created_at)?->toDateTimeString(),
        ]);

        return Inertia::render('admin/articles/show', [
            'article' => $payload,
            'labels'  => Article::labels(),
            'reviews' => $reviews,  // <-- hanya milik artikel ini
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

        // Simpan stabilo/HiLo & (opsional) keywords baru kedalam meta agar Author melihatnya saat edit
        $meta = (array) ($article->meta ?? []);
        if ($request->has('hilos') && is_array($request->input('hilos'))) {
            $meta['hilos'] = array_values($request->input('hilos'));
        }
        if ($request->has('keywords') && is_array($request->input('keywords'))) {
            $meta['keywords'] = array_values($request->input('keywords'));
        }
        $article->meta = $meta;

        $article->save();

        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'request_revision',
            'from_status' => $from,
            'to_status'   => Article::ST_REVISION,
            'note'        => $request->input('note'), // alasan revisi
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

    public function updateContent(Request $request, Article $article)
    {
        \Gate::authorize('reviewAsEditor', $article); // atau policy lain yang sesuai
        $html = (string) $request->input('content', '');

        // Simpan apa adanya (Quill sudah meng-escape); jika perlu tambahkan sanitizer
        $article->update([
            'content' => $html,
            // optional: ikut update excerpt agar preview konsisten
            'excerpt' => strip_tags($html) ? str($html)->stripTags()->limit(280, '...') : $article->excerpt,
        ]);

        // log kecil (opsional)
        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'highlight_update',
            'from_status' => $article->status,
            'to_status'   => $article->status,
            'note'        => 'Update konten dengan stabilo',
        ]);

        return back()->with('success','Konten tersimpan.');
    }
}