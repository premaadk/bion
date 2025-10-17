<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Stichoza\GoogleTranslate\GoogleTranslate;

class Translator
{
    /**
     * Translate with ID↔EN flow and cache into DB table `dynamic_translations` if present.
     * If table is absent, it still returns translated text without storing.
     */
    public static function translateAndCache(string $text, string $source): string
    {
        $source = in_array($source, ['id','en'], true) ? $source : 'id';
        $target = $source === 'id' ? 'en' : 'id';

        // Check existing cache (if table exists)
        if (self::tableExists('dynamic_translations')) {
            $found = DB::table('dynamic_translations')
                ->where('source_text', $text)
                ->where('source_lang', $source)
                ->where('target_lang', $target)
                ->value('translated_text');

            if ($found) {
                return $found;
            }
        }

        $tr = new GoogleTranslate();
        $tr->setSource($source)->setTarget($target);
        $result = $tr->translate($text);

        if (self::tableExists('dynamic_translations')) {
            DB::table('dynamic_translations')->insert([
                'source_text' => $text,
                'source_lang' => $source,
                'target_lang' => $target,
                'translated_text' => $result,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $result;
    }

    private static function tableExists(string $name): bool
    {
        try {
            return \Schema::hasTable($name);
        } catch (\Throwable) {
            return false;
        }
    }
}
