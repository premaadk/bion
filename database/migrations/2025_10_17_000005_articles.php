<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (!Schema::hasColumn('articles', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('content');
            }
            if (!Schema::hasColumn('articles', 'is_anonymous')) {
                $table->boolean('is_anonymous')->default(false)->after('published_at');
            }
            if (!Schema::hasColumn('articles', 'meta')) {
                $table->json('meta')->nullable()->after('is_anonymous');
            }
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (Schema::hasColumn('articles', 'meta')) {
                $table->dropColumn('meta');
            }
            if (Schema::hasColumn('articles', 'is_anonymous')) {
                $table->dropColumn('is_anonymous');
            }
            if (Schema::hasColumn('articles', 'published_at')) {
                $table->dropColumn('published_at');
            }
        });
    }
};
