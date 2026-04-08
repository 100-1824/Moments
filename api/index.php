<?php
// Health check endpoint
if (($_SERVER['REQUEST_URI'] ?? '') === '/api/health' || ($_SERVER['REQUEST_PATH'] ?? '') === '/api/health') {
    header('Content-Type: application/json');
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'timestamp' => date('c')]);
    exit;
}

// Create writable directories for Laravel internals
$tmpDirs = ['/tmp/storage/framework/views', '/tmp/storage/framework/cache', '/tmp/storage/framework/sessions', '/tmp/logs'];
foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
}

try {
    // Load Laravel
    require __DIR__ . '/../backend/vendor/autoload.php';
    $app = require_once __DIR__ . '/../backend/bootstrap/app.php';
    
    $app->useStoragePath('/tmp/storage');

    // Handle the request
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $response = $kernel->handle($request = Illuminate\Http\Request::capture());
    $response->send();
    $kernel->terminate($request, $response);
    
} catch (\Throwable $e) {
    // Always return JSON, never HTML error pages
    http_response_code(500);
    header('Content-Type: application/json');
    header('X-Powered-By: Moments-API');
    
    error_log('[Moments API Error] ' . get_class($e) . ': ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    
    $isDebug = filter_var($_ENV['APP_DEBUG'] ?? $_SERVER['APP_DEBUG'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
    
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error',
        'debug' => $isDebug ? [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ] : null
    ]);
}
