<?php
// Create writable directories for Laravel internals
$tmpDirs = ['/tmp/storage/framework/views', '/tmp/storage/framework/cache', '/tmp/storage/framework/sessions', '/tmp/logs'];
foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) mkdir($dir, 0777, true);
}

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';

$app->useStoragePath('/tmp/storage');

// Initialize database on first run
$dbPath = '/tmp/moments.sqlite';
if (!file_exists($dbPath)) {
    touch($dbPath);
    chmod($dbPath, 0666);
    
    // Run migrations
    $artisan = $app->make(\Illuminate\Contracts\Console\Kernel::class);
    $artisan->call('migrate', ['--force' => true, '--quiet' => true]);
}

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle($request = Illuminate\Http\Request::capture());
$response->send();
$kernel->terminate($request, $response);
