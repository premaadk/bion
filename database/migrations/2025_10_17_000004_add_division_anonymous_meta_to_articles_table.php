<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // division_id (nullable) -> rel ke divisions.id
            if (!Schema::hasColumn('articles', 'division_id')) {
                // gunakan foreignId supaya FK otomatis kalau tabel divisions ada
                $table->foreignId('division_id')
                    ->nullable()
                    ->after('rubrik_id')
                    ->constrained('divisions')
                    ->nullOnDelete();
            }

            // is_anonymous (boolean)
            if (!Schema::hasColumn('articles', 'is_anonymous')) {
                $table->boolean('is_anonymous')
                    ->default(false)
                    ->after('content');
            }

            // meta (json)
            if (!Schema::hasColumn('articles', 'meta')) {
                $table->json('meta')->nullable()->after('is_anonymous');
            }

            // published_at (datetime) — kalau belum ada
            if (!Schema::hasColumn('articles', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            // drop FK dulu kalau ada
            if (Schema::hasColumn('articles', 'division_id')) {
                // nama FK default: articles_division_id_foreign
                try { $table->dropForeign(['division_id']); } catch (\Throwable $e) {}
                $table->dropColumn('division_id');
            }

            if (Schema::hasColumn('articles', 'is_anonymous')) {
                $table->dropColumn('is_anonymous');
            }

            if (Schema::hasColumn('articles', 'meta')) {
                $table->dropColumn('meta');
            }

            if (Schema::hasColumn('articles', 'published_at')) {
                $table->dropColumn('published_at');
            }
        });
    }
};
