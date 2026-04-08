<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Default API throttle: 60 req/minute per token, falling back to IP
        // for unauthenticated requests like /api/auth/register.
        RateLimiter::for('api', function (Request $request): Limit {
            $key = optional($request->user())->id ?: $request->ip();

            return Limit::perMinute(60)->by((string) $key);
        });
    }
}
