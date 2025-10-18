<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleReview extends Model
{
    protected $fillable = [
        'article_id','actor_id','action','from_status','to_status','note'
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function actor(): BelongsTo
    {
        // cukup id & name untuk ditampilkan
        return $this->belongsTo(User::class, 'actor_id')->select(['id', 'name']);
    }
}
