<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Article extends Model
{
    protected $fillable = [
        'author_id',
        'rubrik_id',
        'division_id',
        'title',
        'slug',
        'status',
        'excerpt',
        'content',
        'published_at',
        'is_anonymous',
        'meta',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_anonymous' => 'boolean',
        'meta' => 'array',
    ];

    public const ST_DRAFT         = 'draft';
    public const ST_SUBMITTED     = 'submitted';
    public const ST_REVIEW_EDITOR = 'review_editor';
    public const ST_REVISION      = 'revision';
    public const ST_REVISED       = 'revised';
    public const ST_APPROVED      = 'approved';
    public const ST_REVIEW_ADMIN  = 'review_admin';
    public const ST_REJECTED      = 'rejected';
    public const ST_PUBLISHED     = 'published';

    public static function labels(): array
    {
        return [
            self::ST_DRAFT         => 'Draft',
            self::ST_SUBMITTED     => 'Submitted',
            self::ST_REVIEW_EDITOR => 'Review by Editor',
            self::ST_REVISION      => 'Revision',
            self::ST_REVISED       => 'Revised',
            self::ST_APPROVED      => 'Approved',
            self::ST_REVIEW_ADMIN  => 'Review by Admin',
            self::ST_REJECTED      => 'Rejected',
            self::ST_PUBLISHED     => 'Published',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $article) {
            if (empty($article->status)) {
                $article->status = self::ST_DRAFT;
            }
            if (empty($article->author_id) && auth()->check()) {
                $article->author_id = auth()->id();
            }
            if (empty($article->slug) && !empty($article->title)) {
                $article->slug = Str::slug($article->title) . '-' . Str::random(6);
            }
        });

        static::updating(function (self $article) {
            if (empty($article->slug) && !empty($article->title)) {
                $article->slug = Str::slug($article->title) . '-' . Str::random(6);
            }
        });
    }

    // ==== Relations ====
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class,'author_id');
    }

    public function rubrik(): BelongsTo
    {
        return $this->belongsTo(Rubrik::class,'rubrik_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class,'division_id');
    }

    /**
     * Riwayat review artikel (submit, request_revision, approve, dst).
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(ArticleReview::class, 'article_id');
    }

    // ==== Scopes ====
    public function scopeOwned($q, int $userId)
    {
        return $q->where('author_id', $userId);
    }

    public function scopeSameRubrikAs($q, ?int $rubrikId)
    {
        if ($rubrikId) return $q->where('rubrik_id', $rubrikId);
        return $q->whereRaw('1=0');
    }

    // ==== Mutators ====
    public function setTitleAttribute($value): void
    {
        $this->attributes['title'] = $value;
        if (!$this->exists || empty($this->attributes['slug'])) {
            $slug = Str::slug($value);
            $this->attributes['slug'] = $slug . '-' . Str::random(6);
        }
    }

    // ==== (Opsional) Helper Accessors berbasis meta ====
    public function getKeywordsAttribute(): array
    {
        $meta = $this->meta ?? [];
        return is_array($meta['keywords'] ?? null) ? $meta['keywords'] : [];
    }

    public function getCoverUrlAttribute(): ?string
    {
        $meta = $this->meta ?? [];
        return $meta['cover_url'] ?? null;
    }

    public function getCoverPathAttribute(): ?string
    {
        $meta = $this->meta ?? [];
        return $meta['cover_path'] ?? null;
    }
}