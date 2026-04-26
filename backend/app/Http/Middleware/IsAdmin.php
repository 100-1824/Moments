<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts admin access to the designated admin email + is_admin flag.
 */
class IsAdmin
{
    private const ADMIN_EMAIL = '18umair24@gmail.com';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthenticated.');
        }

        if (! $user->is_admin || strtolower($user->email) !== self::ADMIN_EMAIL) {
            abort(403, 'Admin access required.');
        }

        return $next($request);
    }
}
