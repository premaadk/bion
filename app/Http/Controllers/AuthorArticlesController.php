<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Article\StoreArticleRequest;
use App\Http\Requests\Article\UpdateArticleRequest;
use App\Models\Article;
use App\Models\ArticleReview;
use App\Models\Rubrik;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AuthorArticlesController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $articles = Article::query()
            ->owned($user->id)
            ->with([
                'rubrik:id,name',
                // ambil 1 review terakhir (dipakai untuk alasan reject)
                'reviews' => fn ($q) => $q->latest('created_at')->limit(1),
            ])
            ->latest('updated_at')
            ->get([
                'id','title','slug','status','rubrik_id','author_id',
                'excerpt','meta','updated_at','created_at',
            ]);

        return Inertia::render('articles/index', [
            'articles' => $articles->map(function (Article $a) {
                $meta = (array) ($a->meta ?? []);
                $cover = $meta['cover_url'] ?? null;
                return [
                    'id'         => $a->id,
                    'title'      => $a->title,
                    'slug'       => $a->slug,
                    'status'     => $a->status,
                    'rubrik'     => $a->rubrik?->name,
                    'excerpt'    => $a->excerpt,
                    'cover_url'  => $cover,
                    'updated_at' => optional($a->updated_at)?->toDateTimeString(),
                    'created_at' => optional($a->created_at)?->toDateTimeString(),
                    // alasan penolakan → ambil dari review terakhir kalau action=reject
                    'reason'     => optional($a->reviews->first())->action === 'reject'
                        ? $a->reviews->first()->note
                        : null,
                ];
            }),
            'statuses' => Article::labels(),
            'rubriks'  => Rubrik::orderBy('name')->get(['id','name']),
        ]);
    }

    public function create()
    {
        return Inertia::render('articles/create', [
            'rubriks' => Rubrik::orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(StoreArticleRequest $request)
    {
        $user = $request->user();

        // Normalisasi META (simpan cover dari dataURL ke storage publik, bersihkan keywords)
        $meta = $this->normalizeMeta($request->input('meta', []));

        $article = Article::create([
            'author_id'   => $user->id,
            'rubrik_id'   => $request->input('rubrik_id'),
            'division_id' => $user->id_division ?: null,
            'title'       => $request->input('title'),
            'slug'        => $request->input('slug'),
            'excerpt'     => $request->input('excerpt'),
            'content'     => $request->input('content'),
            'is_anonymous'=> (bool) $request->boolean('is_anonymous', false),
            'status'      => Article::ST_DRAFT,
            'meta'        => $meta,
        ]);

        if ($request->boolean('submit')) {
            $from = $article->status;
            $article->status = Article::ST_SUBMITTED;
            $article->save();

            ArticleReview::create([
                'article_id'  => $article->id,
                'actor_id'    => $user->id,
                'action'      => 'submit',
                'from_status' => $from,
                'to_status'   => Article::ST_SUBMITTED,
                'note'        => $request->input('note'),
            ]);
        }

        return to_route('articles.index')->with('success', $request->boolean('submit') ? 'Article submitted.' : 'Draft created.');
    }

    // App/Http/Controllers/AuthorArticlesController.php

   public function edit(Article $article)
    {
        Gate::authorize('update', $article); // pastikan pemiliknya

        $article->load([
            'rubrik:id,name',
            'author:id,name',
            // Ambil hanya riwayat milik artikel ini
            'reviews' => fn ($q) => $q->latest('created_at')->with('actor:id,name'),
        ]);

        $meta      = (array) ($article->meta ?? []);
        $coverUrl  = $meta['cover_url']  ?? null;
        $coverPath = $meta['cover_path'] ?? null;
        if (!$coverUrl && $coverPath) {
            $coverUrl = Storage::disk('public')->url($coverPath);
        }

        return Inertia::render('articles/edit', [
            'article' => [
                'id'           => $article->id,
                'title'        => $article->title,
                'status'       => $article->status,
                'rubrik_id'    => $article->rubrik_id,
                'rubrik'       => $article->rubrik?->name,
                'author'       => $article->author?->name,
                'excerpt'      => $article->excerpt,
                'content'      => $article->content,
                'published_at' => optional($article->published_at)?->toDateTimeString(),
                'is_anonymous' => (bool) $article->is_anonymous,
                'meta'         => [
                    'cover_url'  => $coverUrl,
                    'cover_path' => $coverPath,
                    'keywords'   => array_values((array) ($meta['keywords'] ?? [])),
                ],
                'reviews'      => $article->reviews->map(fn ($r) => [
                    'id'         => $r->id,
                    'action'     => $r->action,
                    'note'       => $r->note,
                    'actor'      => $r->actor?->name,
                    'created_at' => optional($r->created_at)?->toDateTimeString(),
                ]),
            ],
            'labels'  => Article::labels(),
            'rubriks' => Rubrik::select('id','name')->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Article $article)
    {
        Gate::authorize('update', $article);

        $data = $request->validate([
            'title'            => ['required','string','max:255'],
            'slug'             => ['required','string','max:255'],
            'rubrik_id'        => ['nullable','exists:rubriks,id'],
            'excerpt'          => ['nullable','string'],
            'content'          => ['required','string'],
            'is_anonymous'     => ['nullable'],
            'meta.keywords'    => ['array'],
            'meta.keywords.*'  => ['string','max:64'],
        ]);

        $article->fill([
            'title'        => $data['title'],
            'slug'         => $data['slug'],
            'rubrik_id'    => $data['rubrik_id'] ?? null,
            'excerpt'      => $data['excerpt'] ?? null,
            'content'      => $data['content'],
            'is_anonymous' => (bool) ($data['is_anonymous'] ?? false),
        ]);

        $meta = (array) ($article->meta ?? []);
        $meta['keywords'] = array_values($data['meta']['keywords'] ?? []);
        $article->meta = $meta;

        $article->save();

        // log aktivitas ringan (opsional)
        $article->reviews()->create([
            'actor_id' => $request->user()->id,
            'action'   => 'update',
            'note'     => null,
        ]);

        return back()->with('success', 'Artikel tersimpan.');
    }

    public function show(Article $article)
    {
        Gate::authorize('view', $article);

        // Muat relasi yang dibutuhkan + reviews milik artikel ini saja (beserta actor)
        $article->load([
            'rubrik:id,name',
            'author:id,name',
            'reviews' => fn ($q) => $q->latest('created_at')->with('actor:id,name'),
        ]);

        // Normalisasi meta cover (fallback dari cover_path → url publik)
        $meta      = (array) ($article->meta ?? []);
        $coverUrl  = $meta['cover_url']  ?? null;
        $coverPath = $meta['cover_path'] ?? null;
        if (!$coverUrl && $coverPath) {
            $coverUrl = Storage::disk('public')->url($coverPath);
        }

        // Payload untuk FE (sesuai pages/articles/show.tsx)
        $payload = [
            'id'           => $article->id,
            'title'        => $article->title,
            'status'       => $article->status,
            'rubrik'       => $article->rubrik?->name,
            'author'       => $article->author?->name,
            'excerpt'      => $article->excerpt,
            'content'      => $article->content, // Quill HTML
            'published_at' => optional($article->published_at)?->toDateTimeString(),
            'is_anonymous' => (bool) $article->is_anonymous,
            'meta'         => [
                'cover_url'  => $coverUrl,
                'cover_path' => $coverPath,
                'keywords'   => array_values((array) ($meta['keywords'] ?? [])),
            ],
            // boleh dikirim di dalam article agar FE bisa konsumsi langsung
            'reviews'      => $article->reviews->map(fn ($r) => [
                'id'         => $r->id,
                'action'     => $r->action,
                'note'       => $r->note,
                'actor'      => optional($r->actor)->name,
                'created_at' => optional($r->created_at)?->toDateTimeString(),
            ]),
        ];

        // opsional: juga kirim di root 'reviews' jika mau dukung 2 pola sekaligus
        $reviews = $article->reviews->map(fn ($r) => [
            'id'         => $r->id,
            'action'     => $r->action,
            'note'       => $r->note,
            'actor'      => optional($r->actor)->name,
            'created_at' => optional($r->created_at)?->toDateTimeString(),
        ]);

        return Inertia::render('articles/show', [
            'article' => $payload,
            'labels'  => Article::labels(),
            'reviews' => $reviews,
        ]);
    }

    public function destroy(Article $article)
    {
        $this->authorize('delete', $article);
        $article->delete();
        return to_route('articles.index')->with('success','Draft deleted.');
    }

    public function submit(Request $request, Article $article)
    {
        $this->authorize('submit', $article);

        $from = $article->status;

        // Jika sedang revisi dan penulis submit, status menjadi REVISED (bukan SUBMITTED)
        if ($from === Article::ST_REVISION) {
            $article->status = Article::ST_REVISED;
        } else {
            $article->status = Article::ST_SUBMITTED;
        }
        $article->save();

        ArticleReview::create([
            'article_id'  => $article->id,
            'actor_id'    => $request->user()->id,
            'action'      => 'submit',
            'from_status' => $from,
            'to_status'   => $article->status,
            'note'        => $request->input('note'),
        ]);

        return to_route('articles.index')->with('success','Article submitted.');
    }

    /**
     * Normalisasi meta:
     * - keywords: array string unik, trim, max 64 char
     * - cover_data_url: bila ada, disimpan ke storage publik → kembalikan cover_path & cover_url
     * - hilos: biarkan array (stabilo/HiLo) apa adanya
     */
    private function normalizeMeta(array $meta, ?Article $existing = null): array
    {
        // Keywords
        $keywords = [];
        if (isset($meta['keywords']) && is_array($meta['keywords'])) {
            foreach ($meta['keywords'] as $kw) {
                $kw = trim((string) $kw);
                if ($kw !== '' && mb_strlen($kw) <= 64) {
                    $keywords[$kw] = true; // unique
                }
            }
        }
        $meta['keywords'] = array_keys($keywords);

        // Pass-through HiLo (stabilo)
        if (isset($meta['hilos']) && is_array($meta['hilos'])) {
            // tidak diubah; biarkan frontend menentukan struktur objek hilos
            $meta['hilos'] = array_values($meta['hilos']);
        }

        // Cover from data URL
        if (!empty($meta['cover_data_url']) && is_string($meta['cover_data_url']) && str_starts_with($meta['cover_data_url'], 'data:image/')) {
            $saved = $this->storeBase64Image($meta['cover_data_url']);
            if ($saved) {
                $meta['cover_path'] = $saved['path'];
                $meta['cover_url']  = $saved['url'];
            }
            unset($meta['cover_data_url']);
        }

        // Jika tidak ada cover baru, pertahankan cover lama (saat update)
        if ($existing && empty($meta['cover_path']) && empty($meta['cover_url'])) {
            $old = (array) ($existing->meta ?? []);
            if (!empty($old['cover_path'])) $meta['cover_path'] = $old['cover_path'];
            if (!empty($old['cover_url']))  $meta['cover_url']  = $old['cover_url'];
        }

        return $meta;
    }

    /**
     * Simpan DataURL base64 image ke storage publik.
     * @return array{path:string,url:string}|null
     */
    private function storeBase64Image(string $dataUrl): ?array
    {
        // data:image/png;base64,xxxxx
        if (!preg_match('#^data:image/(png|jpe?g|gif|webp);base64,#i', $dataUrl, $m)) {
            return null;
        }
        $ext = strtolower($m[1] === 'jpeg' ? 'jpg' : $m[1]);
        $base64 = substr($dataUrl, strpos($dataUrl, ',') + 1);
        $binary = base64_decode($base64, true);
        if ($binary === false) return null;

        $dir  = 'articles/covers/' . date('Y/m');
        $name = Str::uuid()->toString() . '.' . $ext;
        $path = $dir . '/' . $name;

        Storage::disk('public')->put($path, $binary, ['visibility' => 'public']);

        return [
            'path' => $path,
            'url'  => Storage::disk('public')->url($path),
        ];
        // Pastikan disk 'public' sudah ter-publish: php artisan storage:link
    }

    public function updateCover(Request $request, Article $article)
    {
        Gate::authorize('update', $article);

        $request->validate([
            'cover' => ['required','image','max:10240'], // 10 MB
        ]);

        $path = $request->file('cover')->store('articles/covers', 'public');

        $meta = (array) ($article->meta ?? []);
        $meta['cover_path'] = $path;
        $meta['cover_url']  = Storage::disk('public')->url($path);
        $article->meta = $meta;
        $article->save();

        $article->reviews()->create([
            'actor_id' => $request->user()->id,
            'action'   => 'change_cover',
            'note'     => null,
        ]);

        return response()->json([
            'cover_url'  => Storage::disk('public')->url($path),
            'cover_path' => $path,
        ]);
    }

    public function markRevised(Request $request, Article $article)
    {
        Gate::authorize('update', $article);

        $validated = $request->validate(['note' => ['nullable','string']]);

        $article->status = 'revised';
        $article->save();

        $article->reviews()->create([
            'actor_id' => $request->user()->id,
            'action'   => 'revised',
            'note'     => $validated['note'] ?? null,
        ]);

        return back()->with('success', 'Revisi dikirim.');
    }

    public function published(Request $request, string $rubrik, string $slug)
    {
        // Ambil artikel yang SUDAH TERBIT sesuai rubrik & slug
        $article = \App\Models\Article::query()
            ->where('slug', $slug)
            ->where('status', \App\Models\Article::ST_PUBLISHED)
            ->whereHas('rubrik', function ($q) use ($rubrik) {
                // jika punya kolom slug, pakai slug; fallback ke name
                $q->where(fn ($w) =>
                    $w->where('slug', $rubrik)->orWhere('name', str_replace('-', ' ', $rubrik))
                );
            })
            ->with(['rubrik:id,name,slug', 'author:id,name'])
            ->firstOrFail();

        $meta = (array) ($article->meta ?? []);
        $coverUrl  = $meta['cover_url']  ?? null;
        $coverPath = $meta['cover_path'] ?? null;
        if (!$coverUrl && $coverPath) {
            $coverUrl = Storage::disk('public')->url($coverPath);
        }

        return Inertia::render('articles/published', [
            'article' => [
                'id'           => $article->id,
                'title'        => $article->title,
                'slug'         => $article->slug,
                'rubrik'       => $article->rubrik?->name,
                'rubrik_slug'  => $article->rubrik?->slug,
                'author'       => $article->author?->name,
                'published_at' => optional($article->published_at)?->toDateTimeString(),
                'content'      => $article->content, // Quill HTML
                'meta'         => [
                    'cover_url' => $coverUrl,
                    'keywords'  => array_values((array) ($meta['keywords'] ?? [])),
                ],
            ],
        ]);
    }
}
