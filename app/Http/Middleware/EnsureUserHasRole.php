<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Authorize the request when the authenticated user has one of the roles.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! collect($roles)->contains(fn (string $role): bool => $user->user_type === $role || $user->hasRole($role))) {
            abort(Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
