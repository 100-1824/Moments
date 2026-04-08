<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;

/**
 * Lightweight helper for emitting the consistent envelope used across the
 * Moments API:
 *
 *     { "status": "success", "data": { ... } }
 *     { "status": "error",   "message": "..." }
 */
trait ApiResponse
{
    protected function success(mixed $data = null, int $status = 200, array $meta = []): JsonResponse
    {
        $payload = ['status' => 'success'];

        if ($data !== null) {
            $payload['data'] = $data;
        }

        if (! empty($meta)) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    protected function error(string $message, int $status = 400, array $extra = []): JsonResponse
    {
        return response()->json(array_merge([
            'status'  => 'error',
            'message' => $message,
        ], $extra), $status);
    }
}
