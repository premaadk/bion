<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Article extends Model
{
    protected $fillable = [
        'author_id','rubrik_id','title','slug','status','excerpt','content','published_at','meta'
    ];

    protected $casts = [
        'published_at' => 'datetime',
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

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class,'author_id');
    }

    public function rubrik(): BelongsTo
    {
        return $this->belongsTo(Rubrik::class,'rubrik_id');
    }

    public function setTitleAttribute($value)
    {
        $this->attributes['title'] = $value;
        if (!$this->exists || empty($this->attributes['slug'])) {
            $slug = Str::slug($value);
            // unique-ish suffix
            $this->attributes['slug'] = $slug . '-' . Str::random(6);
        }
    }

    public function scopeOwned($q, int $userId)
    {
        return $q->where('author_id', $userId);
    }

    public function scopeSameRubrikAs($q, ?int $rubrikId)
    {
        if ($rubrikId) return $q->where('rubrik_id', $rubrikId);
        // jika reviewer tidak punya rubrik_id, jangan kembalikan apa pun (safe)
        return $q->whereRaw('1=0');
    }
}
