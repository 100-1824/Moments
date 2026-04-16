<?php

use App\Models\Moment;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Converts full S3 URLs in the media_url column to relative paths.
     */
    public function up(): void
    {
        Moment::query()
            ->where('media_url', 'like', 'http%')
            ->each(function (Moment $moment) {
                $url = $moment->media_url;
                $path = parse_url($url, PHP_URL_PATH);
                
                if (!$path) {
                    return;
                }

                // Extract the key starting from 'couples/'
                $pos = strpos($path, 'couples/');
                $key = ($pos !== false) ? substr($path, $pos) : ltrim($path, '/');
                
                $moment->update(['media_url' => $key]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way migration as we don't store the base URL
    }
};
