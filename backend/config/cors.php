<?php

/*
 * CORS configuration for the Moments stateless API.
 *
 * The frontend lives on a different origin (Vercel deploy URL or local
 * Vite dev server) so every API and Sanctum endpoint must accept
 * cross-origin requests. We deliberately avoid `supports_credentials`
 * because Sanctum is configured for token-only auth — no cookies.
 */

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'up',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', '*'))
    )),

    'allowed_origins_patterns' => array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGIN_PATTERNS', ''))
    )),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => false,

];
