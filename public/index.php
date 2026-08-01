<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// تسجيل الأخطاء
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../storage/logs/php_errors.log');

// معالج الأخطاء المخصص
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    $log = "[" . date('Y-m-d H:i:s') . "] ERROR: $errstr in $errfile on line $errline\n";
    file_put_contents(__DIR__ . '/../storage/logs/php_errors.log', $log, FILE_APPEND);
    return true;
});

set_exception_handler(function($exception) {
    $log = "[" . date('Y-m-d H:i:s') . "] EXCEPTION: " . $exception->getMessage() . 
           " in " . $exception->getFile() . " on line " . $exception->getLine() . "\n" .
           $exception->getTraceAsString() . "\n";
    file_put_contents(__DIR__ . '/../storage/logs/php_errors.log', $log, FILE_APPEND);
    
    // إذا كان التطبيق في وضع الإنتاج، عرض رسالة عامة
    if (env('APP_ENV') === 'production') {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'حدث خطأ في الخادم']);
    } else {
        throw $exception;
    }
});

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        $log = "[" . date('Y-m-d H:i:s') . "] FATAL: " . $error['message'] . 
               " in " . $error['file'] . " on line " . $error['line'] . "\n";
        file_put_contents(__DIR__ . '/../storage/logs/php_errors.log', $log, FILE_APPEND);
    }
});

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Request::capture();

try {
    $response = $kernel->handle($request);
    $response->send();
    $kernel->terminate($request, $response);
} catch (\Exception $e) {
    $log = "[" . date('Y-m-d H:i:s') . "] REQUEST_ERROR: " . $e->getMessage() . 
           " in " . $e->getFile() . " on line " . $e->getLine() . "\n" .
           $e->getTraceAsString() . "\n";
    file_put_contents(__DIR__ . '/../storage/logs/php_errors.log', $log, FILE_APPEND);
    
    if (env('APP_ENV') === 'production') {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'حدث خطأ في الخادم']);
    } else {
        throw $e;
    }
}