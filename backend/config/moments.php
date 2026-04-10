<?php

/**
 * Moments - Environment Variable Fallback Configuration
 * 
 * This file provides sensible defaults and attempts to load from
 * environment variables. If env vars are not set, it will guide
 * the user to configure them.
 */

return [
    'app_key' => env('APP_KEY', 'base64:vy6dXzl9qTfPiCzZtBJBGb7JGbc9hInaiobAXX9tjY8='),
    'app_env' => env('APP_ENV', 'production'),
    'app_debug' => filter_var(env('APP_DEBUG', 'false'), FILTER_VALIDATE_BOOLEAN),
    
    'database' => [
        'connection' => env('DB_CONNECTION', 'pgsql'),
        'host' => env('DB_HOST', 'ep-dry-thunder-ancazkjj-pooler.c-6.us-east-1.aws.neon.tech'),
        'port' => env('DB_PORT', '5432'),
        'database' => env('DB_DATABASE', 'neondb'),
        'username' => env('DB_USERNAME', 'neondb_owner'),
        'password' => env('DB_PASSWORD', ''),
        'sslmode' => env('DB_SSLMODE', 'require'),
    ],
    
    'storage' => [
        'disk' => env('FILESYSTEM_DISK', 's3'),
        'driver' => env('FILESYSTEM_DRIVER', 's3'),
        'aws' => [
            'key' => env('AWS_ACCESS_KEY_ID', ''),
            'secret' => env('AWS_SECRET_ACCESS_KEY', ''),
            'region' => env('AWS_REGION', 'us-east-1'),
            'bucket' => env('AWS_BUCKET', 'moments-media'),
            'endpoint' => env('AWS_ENDPOINT', ''),
            'use_path_style_endpoint' => filter_var(env('AWS_USE_PATH_STYLE_ENDPOINT', 'true'), FILTER_VALIDATE_BOOLEAN),
        ],
    ],
    
    'cors' => [
        'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'https://moments-us-app.vercel.app')),
    ],
];
