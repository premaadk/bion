<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('rubrik_id')->nullable()->constrained('rubriks')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('status')->default('draft'); // draft, submitted, review_editor, revision, revised, approved, review_admin, rejected, published
            $table->string('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->index(['status', 'rubrik_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
