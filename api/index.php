<?php
// Health check endpoint
if (($_SERVER['REQUEST_URI'] ?? '') === '/api/health' || ($_SERVER['REQUEST_PATH'] ?? '') === '/api/health') {
    header('Content-Type: application/json');
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'timestamp' => date('c')]);
    exit;
}

// Lightweight diagnostics for production troubleshooting.
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
if ($requestPath === '/api/diagnostics' && ($_GET['diagnose'] ?? '') === '1') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'ok',
        'paths' => [
            'vendor_autoload' => __DIR__ . '/../backend/vendor/autoload.php',
            'vendor_autoload_exists' => file_exists(__DIR__ . '/../backend/vendor/autoload.php'),
            'bootstrap_app' => __DIR__ . '/../backend/bootstrap/app.php',
            'bootstrap_app_exists' => file_exists(__DIR__ . '/../backend/bootstrap/app.php'),
        ],
        'environment' => [
            'app_key_present' => !empty($_ENV['APP_KEY'] ?? $_SERVER['APP_KEY'] ?? null),
            'app_debug' => $_ENV['APP_DEBUG'] ?? $_SERVER['APP_DEBUG'] ?? null,
            'db_connection' => $_ENV['DB_CONNECTION'] ?? $_SERVER['DB_CONNECTION'] ?? null,
            'db_url_present' => !empty($_ENV['DB_URL'] ?? $_SERVER['DB_URL'] ?? null),
            'db_host_present' => !empty($_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'] ?? null),
            'db_port' => $_ENV['DB_PORT'] ?? $_SERVER['DB_PORT'] ?? null,
            'db_database_present' => !empty($_ENV['DB_DATABASE'] ?? $_SERVER['DB_DATABASE'] ?? null),
            'db_username_present' => !empty($_ENV['DB_USERNAME'] ?? $_SERVER['DB_USERNAME'] ?? null),
            'db_password_present' => !empty($_ENV['DB_PASSWORD'] ?? $_SERVER['DB_PASSWORD'] ?? null),
            'db_sslmode' => $_ENV['DB_SSLMODE'] ?? $_SERVER['DB_SSLMODE'] ?? null,
            'cache_driver' => $_ENV['CACHE_DRIVER'] ?? $_SERVER['CACHE_DRIVER'] ?? null,
            'session_driver' => $_ENV['SESSION_DRIVER'] ?? $_SERVER['SESSION_DRIVER'] ?? null,
        ],
        'php' => [
            'version' => PHP_VERSION,
            'pdo_available' => extension_loaded('pdo'),
            'pdo_drivers' => PDO::getAvailableDrivers(),
            'pdo_pgsql_available' => extension_loaded('pdo_pgsql'),
            'pdo_mysql_available' => extension_loaded('pdo_mysql'),
            'extensions' => [
                'openssl' => extension_loaded('openssl'),
                'mbstring' => extension_loaded('mbstring'),
                'tokenizer' => extension_loaded('tokenizer'),
                'xml' => extension_loaded('xml'),
                'ctype' => extension_loaded('ctype'),
                'json' => extension_loaded('json'),
                'fileinfo' => extension_loaded('fileinfo'),
                'phar' => extension_loaded('phar'),
            ],
        ],
        'request' => [
            'uri' => $_SERVER['REQUEST_URI'] ?? null,
            'path' => $requestPath,
            'query' => $_SERVER['QUERY_STRING'] ?? null,
        ],
    ], JSON_PRETTY_PRINT);
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
    $isDiagnostics = $requestPath === '/api/diagnostics' && ($_GET['diagnose'] ?? '') === '1';
    
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal server error',
        'debug' => $isDiagnostics ? [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => explode("\n", $e->getTraceAsString()),
        ] : ($isDebug ? [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ] : null),
    ], JSON_PRETTY_PRINT);
}
