<?php

/**
 * Vercel serverless entry point for the Moments Laravel API.
 *
 * vercel-php routes every incoming request to this file. Because Vercel's
 * filesystem is read-only except for /tmp, we redirect all of Laravel's
 * writable paths (compiled views, caches, logs) to /tmp before bootstrapping
 * the framework.
 */

// Suppress PHP's default HTML error output. Any uncaught exception that
// occurs before Laravel's exception handler is registered (e.g. missing
// APP_KEY) will be returned as a JSON envelope instead of an HTML page.
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');

set_exception_handler(function (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Server configuration error: ' . $e->getMessage(),
    ]);
    exit(1);
});

set_error_handler(function (int $severity, string $message, string $file, int $line) {
    if ($severity & error_reporting()) {
        throw new \ErrorException($message, 0, $severity, $file, $line);
    }
    return false;
});

// Redirect Laravel's writable directories to the Vercel-writable /tmp partition.
$tmpPath = '/tmp';
$writablePaths = [
    $tmpPath . '/storage/app',
    $tmpPath . '/storage/framework/cache/data',
    $tmpPath . '/storage/framework/views',
    $tmpPath . '/storage/framework/sessions',
    $tmpPath . '/storage/logs',
    $tmpPath . '/bootstrap/cache',
];

foreach ($writablePaths as $path) {
    if (! is_dir($path)) {
        @mkdir($path, 0755, true);
    }
}

putenv('VIEW_COMPILED_PATH=' . $tmpPath . '/storage/framework/views');
putenv('APP_STORAGE=' . $tmpPath . '/storage');
$_ENV['VIEW_COMPILED_PATH'] = $tmpPath . '/storage/framework/views';
$_ENV['APP_STORAGE'] = $tmpPath . '/storage';

define('LARAVEL_START', microtime(true));

require __DIR__ . '/../../vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require_once __DIR__ . '/../bootstrap/app.php';

$app->useStoragePath($tmpPath . '/storage');

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

try {
    $request  = Illuminate\Http\Request::capture();
    $response = $kernel->handle($request);

    // Send status + headers manually. Calling $response->send() triggers
    // Symfony's closeOutputBuffers() which flushes and closes the output
    // capture buffer that vercel-php uses, resulting in a truncated or
    // empty response body. Manually sending avoids that problem.
    http_response_code($response->getStatusCode());

    foreach ($response->headers->allPreserveCase() as $name => $values) {
        $replace = true;
        foreach ($values as $value) {
            header("{$name}: {$value}", $replace, $response->getStatusCode());
            $replace = false;
        }
    }

    echo $response->getContent();

    $kernel->terminate($request, $response);
} catch (\Throwable $e) {
    // Last-resort: catches anything that escaped Laravel's exception handler
    // (e.g. a crash inside the render closure itself).
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => $e->getMessage() . ' — ' . basename($e->getFile()) . ':' . $e->getLine(),
    ], JSON_PARTIAL_OUTPUT_ON_ERROR | JSON_UNESCAPED_UNICODE);
}
