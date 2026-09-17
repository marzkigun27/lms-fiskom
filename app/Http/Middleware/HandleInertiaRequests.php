<?php

namespace App\Http\Middleware;

use App\Services\GlobalControl\RegistrationControlService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        if ($request->hasSession()) {
            $session = $request->session();
            $alreadyFlashed = Inertia::getFlashed($request);

            if (! isset($alreadyFlashed['toast'])) {
                if ($session->has('toast')) {
                    Inertia::flash('toast', $session->get('toast'));
                } else {
                    foreach (['error', 'warning', 'info', 'success', 'status', 'message'] as $key) {
                        if ($session->has($key)) {
                            $val = $session->get($key);
                            if (is_string($val)) {
                                $type = match ($key) {
                                    'error' => 'error',
                                    'warning' => 'warning',
                                    'info' => 'info',
                                    default => 'success',
                                };

                                Inertia::flash('toast', [
                                    'type' => $type,
                                    'message' => $val,
                                ]);
                                break;
                            }
                        }
                    }
                }
            }
        }

        $flashedToast = Inertia::getFlashed($request)['toast']
            ?? ($request->hasSession() ? $request->session()->get('toast') : null);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'success' => $request->hasSession() ? $request->session()->get('success') : null,
                'error' => $request->hasSession() ? $request->session()->get('error') : null,
                'warning' => $request->hasSession() ? $request->session()->get('warning') : null,
                'info' => $request->hasSession() ? $request->session()->get('info') : null,
                'status' => $request->hasSession() ? $request->session()->get('status') : null,
                'message' => $request->hasSession() ? $request->session()->get('message') : null,
                'toast' => $flashedToast,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],
            'registration' => fn () => app(RegistrationControlService::class)->getState(),
        ];
    }
}
