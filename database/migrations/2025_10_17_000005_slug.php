<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private function indexExists(string $table, string $indexName): bool
    {
        // Cek index dengan nama tertentu pada DB aktif (tanpa DBAL)
        $rows = DB::select('SHOW INDEX FROM `'.$table.'` WHERE Key_name = ?', [$indexName]);
        return count($rows) > 0;
    }

    private function hasUniqueOnColumn(string $table, string $column): bool
    {
        // Cek apakah sudah ada UNIQUE index di kolom tsb
        $rows = DB::select('SHOW INDEX FROM `'.$table.'` WHERE Column_name = ? AND Non_unique = 0', [$column]);
        return count($rows) > 0;
    }

    public function up(): void
    {
        if (! Schema::hasTable('articles') || ! Schema::hasColumn('articles', 'slug')) {
            return;
        }

        // Hanya tambahkan unique kalau belum ada sama sekali
        if (! $this->indexExists('articles', 'articles_slug_unique') && ! $this->hasUniqueOnColumn('articles', 'slug')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->unique('slug', 'articles_slug_unique');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('articles')) {
            return;
        }

        // Drop berdasarkan nama index jika ada, fallback ke dropUnique(['slug'])
        if ($this->indexExists('articles', 'articles_slug_unique')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropUnique('articles_slug_unique');
            });
        } elseif ($this->hasUniqueOnColumn('articles', 'slug')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropUnique(['slug']);
            });
        }
    }
};
