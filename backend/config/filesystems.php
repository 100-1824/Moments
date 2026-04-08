<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Moments is a stateless serverless application. We forbid local disk
    | persistence entirely and force all media to flow through an
    | S3-compatible object store.
    |
    */

    'default' => env('FILESYSTEM_DISK', 's3'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Only the `s3` disk is exposed. The driver is AWS S3-compatible and
    | works with any S3-compatible provider — this app uses Cloudflare R2
    | (free tier). Set AWS_ENDPOINT to your R2 account endpoint and set
    | AWS_DEFAULT_REGION=auto. No local disk persistence is allowed.
    |
    */

    'disks' => [

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            // R2 uses 'auto' as region; standard AWS regions also work.
            'region' => env('AWS_DEFAULT_REGION', 'auto'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            // R2 requires path-style endpoint access (not virtual-hosted).
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', true),
            'visibility' => 'private',
            'throw' => true,
            'report' => true,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | No symbolic links are required in a stateless deployment.
    |
    */

    'links' => [],

];
