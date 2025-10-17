<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    public function view(User $user, Article $article): bool
    {
        if ($user->hasRole('Super Admin')) return true;

        // Author: boleh lihat artikelnya sendiri
        if ($article->author_id === $user->id) return true;

        // Editor Rubrik: boleh lihat submitted, review_editor, revision, approved (R only utk submitted/approved)
        if ($user->hasRole('Editor Rubrik') && $user->rubrik_id && $article->rubrik_id === $user->rubrik_id) {
            return in_array($article->status, [
                Article::ST_SUBMITTED,
                Article::ST_REVIEW_EDITOR,
                Article::ST_REVISION,
                Article::ST_APPROVED,
            ], true);
        }

        // Admin Rubrik: boleh lihat approved, review_admin, submitted (R), approved (R)
        if ($user->hasRole('Admin Rubrik') && $user->rubrik_id && $article->rubrik_id === $user->rubrik_id) {
            return in_array($article->status, [
                Article::ST_SUBMITTED,     // R saja
                Article::ST_APPROVED,      // R saja
                Article::ST_REVIEW_ADMIN,
            ], true);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('Author') || $user->hasRole('Super Admin');
    }

    public function update(User $user, Article $article): bool
    {
        // Author: bisa U saat draft/revision
        if ($article->author_id === $user->id) {
            return in_array($article->status, [Article::ST_DRAFT, Article::ST_REVISION], true);
        }
        // Editor: boleh U saat review_editor & revision (memberi note)
        if ($user->hasRole('Editor Rubrik') && $user->rubrik_id && $article->rubrik_id === $user->rubrik_id) {
            return in_array($article->status, [Article::ST_REVIEW_EDITOR, Article::ST_REVISION], true);
        }
        // Admin: boleh U saat review_admin
        if ($user->hasRole('Admin Rubrik') && $user->rubrik_id && $article->rubrik_id === $user->rubrik_id) {
            return $article->status === Article::ST_REVIEW_ADMIN;
        }
        return $user->hasRole('Super Admin');
    }

    public function delete(User $user, Article $article): bool
    {
        // Author: hanya boleh delete saat draft
        if ($article->author_id === $user->id) {
            return $article->status === Article::ST_DRAFT;
        }
        return $user->hasRole('Super Admin');
    }

    public function submit(User $user, Article $article): bool
    {
        if ($article->author_id !== $user->id) return false;
        return in_array($article->status, [Article::ST_DRAFT, Article::ST_REVISION], true) && !empty($article->rubrik_id);
    }

    // Editor actions
    public function reviewAsEditor(User $user, Article $article): bool
    {
        if ($user->hasRole('Super Admin')) return true;
        return $user->hasRole('Editor Rubrik') &&
               $user->rubrik_id &&
               $article->rubrik_id === $user->rubrik_id &&
               in_array($article->status, [Article::ST_SUBMITTED, Article::ST_REVIEW_EDITOR, Article::ST_REVISION], true);
    }

    public function approve(User $user, Article $article): bool
    {
        if ($user->hasRole('Super Admin')) return true;
        return $user->hasRole('Editor Rubrik') &&
               $user->rubrik_id &&
               $article->rubrik_id === $user->rubrik_id &&
               in_array($article->status, [Article::ST_SUBMITTED, Article::ST_REVIEW_EDITOR, Article::ST_REVISION], true);
    }

    public function requestRevision(User $user, Article $article): bool
    {
        return $this->reviewAsEditor($user, $article);
    }

    // Admin actions
    public function reviewAsAdmin(User $user, Article $article): bool
    {
        if ($user->hasRole('Super Admin')) return true;
        return $user->hasRole('Admin Rubrik') &&
               $user->rubrik_id &&
               $article->rubrik_id === $user->rubrik_id &&
               in_array($article->status, [Article::ST_APPROVED, Article::ST_REVIEW_ADMIN], true);
    }

    public function publish(User $user, Article $article): bool
    {
        if ($user->hasRole('Super Admin')) return true;
        return $user->hasRole('Admin Rubrik') &&
               $user->rubrik_id &&
               $article->rubrik_id === $user->rubrik_id &&
               in_array($article->status, [Article::ST_APPROVED, Article::ST_REVIEW_ADMIN], true);
    }

    public function reject(User $user, Article $article): bool
    {
        if ($user->hasRole('Super Admin')) return true;
        return $user->hasRole('Admin Rubrik') &&
               $user->rubrik_id &&
               $article->rubrik_id === $user->rubrik_id &&
               in_array($article->status, [Article::ST_APPROVED, Article::ST_REVIEW_ADMIN], true);
    }
}
