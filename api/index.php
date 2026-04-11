<?php
// Health check endpoint
if (($_SERVER['REQUEST_URI'] ?? '') === '/api/health' || ($_SERVER['REQUEST_PATH'] ?? '') === '/api/health') {
    header('Content-Type: application/json');
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'timestamp' => date('c')]);
    exit;
}

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';


// Create writable directories for Laravel internals
$tmpDirs = ['/tmp/storage/framework/views', '/tmp/storage/framework/cache', '/tmp/storage/framework/sessions', '/tmp/bootstrap/cache', '/tmp/logs'];
foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
}

try {
    // Validate critical environment variables before loading Laravel
    $requiredEnvVars = [
        'APP_KEY' => 'Laravel encryption key is required',
    ];

    $missingVars = [];
    foreach ($requiredEnvVars as $varName => $description) {
        if (empty($_ENV[$varName] ?? $_SERVER[$varName] ?? null)) {
            $missingVars[] = "$varName - $description";
        }
    }

    if (!empty($missingVars)) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'message' => 'Server configuration error',
            'details' => 'Required environment variables are not configured',
            'missing_variables' => $missingVars,
            'help' => 'Ensure all required environment variables are set in your Vercel project settings',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // Load Laravel
    putenv('APP_SERVICES_CACHE=/tmp/services.php');
    putenv('APP_PACKAGES_CACHE=/tmp/packages.php');
    require __DIR__ . '/../vendor/autoload.php';
    $app = require __DIR__ . '/../backend/bootstrap/app.php';

    $app->useStoragePath('/tmp/storage');
    $app->useBootstrapPath('/tmp/bootstrap');
    $_ENV['APP_PACKAGES_CACHE'] = '/tmp/bootstrap/cache/packages.php';
    $_ENV['APP_SERVICES_CACHE'] = '/tmp/bootstrap/cache/services.php';
    $_ENV['LOG_CHANNEL'] = 'errorlog';

    // Temporary: Remote migration trigger for production sync
    if ($requestPath === '/api/admin/migrate-db' && ($_GET['secret'] ?? '') === 'moments-sync-2026') {
        $artisan = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $output = new \Symfony\Component\Console\Output\BufferedOutput();
        $status = $artisan->call('migrate', ['--force' => true], $output);
        
        header('Content-Type: application/json');
        echo json_encode([
            'status' => $status === 0 ? 'success' : 'error',
            'output' => $output->fetch(),
            'message' => 'Migration command executed'
        ]);
        exit;
    }

    // Handle the request
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    $response = $kernel->handle($request = Illuminate\Http\Request::capture());
    $response->send();
    $kernel->terminate($request, $response);

} catch (\Throwable $e) {
    // Always return JSON, never HTML error pages
    http_response_code(500);
    header('Content-Type: application/json');
    header('X-Powered-By: Moments-API');

    $errorMsg = get_class($e) . ': ' . $e->getMessage();
    $errorLocation = $e->getFile() . ':' . $e->getLine();

    error_log('[Moments API Error] ' . $errorMsg . ' in ' . $errorLocation);
    error_log('[Moments API Trace] ' . $e->getTraceAsString());


    echo json_encode([
        'status' => 'error',
        'message' => 'Internal Server Error',
        'error' => $errorMsg,
        'location' => (isset($_ENV['APP_DEBUG']) && $_ENV['APP_DEBUG'] === 'true') ? $errorLocation : null,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}
