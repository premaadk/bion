<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        // Tambah kolom-kolom yang belum ada
        Schema::table('articles', function (Blueprint $table) {
            if (!Schema::hasColumn('articles', 'slug')) {
                // sementara nullable agar bisa isi data dulu lalu set unique index
                $table->string('slug', 200)->nullable()->after('title');
            }
            if (!Schema::hasColumn('articles', 'is_anonymous')) {
                $table->boolean('is_anonymous')->default(false)->after('content')->index();
            }
            if (!Schema::hasColumn('articles', 'meta')) {
                $table->json('meta')->nullable()->after('is_anonymous');
            }
            if (!Schema::hasColumn('articles', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('meta')->index();
            }
            if (!Schema::hasColumn('articles', 'division_id')) {
                $table->foreignId('division_id')->nullable()->after('rubrik_id')
                      ->constrained('divisions')->nullOnDelete();
            }

            // Pastikan kolom status ada index (tanpa DBAL)
            // (jika sudah ada, ini akan diabaikan oleh MySQL/MariaDB)
            try { $table->index('status'); } catch (\Throwable $e) {}
            try { $table->index(['rubrik_id', 'status']); } catch (\Throwable $e) {}
            try { $table->index(['author_id', 'status']); } catch (\Throwable $e) {}
        });

        // Isi slug untuk baris yang kosong/null & pastikan unik
        if (Schema::hasColumn('articles', 'slug')) {
            DB::table('articles')
                ->select('id', 'title', 'slug')
                ->whereNull('slug')
                ->orWhere('slug', '')
                ->orderBy('id')
                ->chunkById(500, function ($rows) {
                    foreach ($rows as $row) {
                        $base = Str::slug($row->title ?? '') ?: 'untitled';
                        $slug = $base;
                        $suffix = 1;

                        // pastikan unik
                        while (
                            DB::table('articles')->where('slug', $slug)->where('id', '!=', $row->id)->exists()
                        ) {
                            $suffix++;
                            $slug = $base.'-'.$suffix;
                        }

                        DB::table('articles')->where('id', $row->id)->update(['slug' => $slug]);
                    }
                });

            // Tambahkan unique index untuk slug (jika belum)
            // Cara aman lintas DBMS:
            try {
                Schema::table('articles', function (Blueprint $table) {
                    $table->unique('slug', 'articles_slug_unique');
                });
            } catch (\Throwable $e) {
                // abaikan kalau sudah ada
            }
        }
    }

    public function down(): void
    {
        // Rollback: hapus index & kolom yang ditambahkan migration ini saja
        Schema::table('articles', function (Blueprint $table) {
            // drop unique slug jika ada
            try { $table->dropUnique('articles_slug_unique'); } catch (\Throwable $e) {}

            if (Schema::hasColumn('articles', 'slug')) {
                $table->dropColumn('slug');
            }
            if (Schema::hasColumn('articles', 'is_anonymous')) {
                $table->dropIndex(['is_anonymous']); // index column
                $table->dropColumn('is_anonymous');
            }
            if (Schema::hasColumn('articles', 'meta')) {
                $table->dropColumn('meta');
            }
            if (Schema::hasColumn('articles', 'published_at')) {
                $table->dropIndex(['published_at']); // index column
                $table->dropColumn('published_at');
            }
            if (Schema::hasColumn('articles', 'division_id')) {
                $table->dropConstrainedForeignId('division_id');
            }

            // indeks tambahan (biarkan saja, atau hapus jika benar2 perlu)
            // try { $table->dropIndex(['status']); } catch (\Throwable $e) {}
            // try { $table->dropIndex(['rubrik_id', 'status']); } catch (\Throwable $e) {}
            // try { $table->dropIndex(['author_id', 'status']); } catch (\Throwable $e) {}
        });
    }
};
