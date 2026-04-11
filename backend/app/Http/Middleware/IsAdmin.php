<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts access to the admin phone number.
 * Additionally requires is_admin=true as a defence-in-depth layer.
 */
class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthenticated.');
        }

        if (! $user->is_admin) {
            abort(403, 'Admin access required.');
        }

        return $next($request);
    }
}
