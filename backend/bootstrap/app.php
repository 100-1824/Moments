<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ThrottleRequestsException;
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Stateless API: enable HandleCors globally and add the
        // throttling layer used by the InteractionController for haptic
        // pings. No session, cookie, or CSRF middleware is registered.
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Render every exception as a consistent JSON envelope.
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            return match (true) {
                $e instanceof ValidationException => response()->json([
                    'status'  => 'error',
                    'message' => 'The given data was invalid.',
                    'errors'  => $e->errors(),
                ], 422),

                $e instanceof AuthenticationException => response()->json([
                    'status'  => 'error',
                    'message' => 'Unauthenticated.',
                ], 401),

                $e instanceof AuthorizationException => response()->json([
                    'status'  => 'error',
                    'message' => $e->getMessage() ?: 'This action is unauthorized.',
                ], 403),

                $e instanceof ModelNotFoundException,
                $e instanceof NotFoundHttpException => response()->json([
                    'status'  => 'error',
                    'message' => 'Resource not found.',
                ], 404),

                $e instanceof ThrottleRequestsException => response()->json([
                    'status'  => 'error',
                    'message' => 'Too many requests. Please slow down.',
                ], 429),

                $e instanceof HttpException => response()->json([
                    'status'  => 'error',
                    'message' => $e->getMessage() ?: 'Request failed.',
                ], $e->getStatusCode()),

                default => response()->json([
                    'status'  => 'error',
                    'message' => 'Internal server error.',
                    'debug'   => config('app.debug') ? $e->getMessage() : null,
                ], 500),
            };
        });
    })->create();
