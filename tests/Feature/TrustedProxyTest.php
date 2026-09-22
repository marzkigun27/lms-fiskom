<?php

use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;

it('trusts the forwarded scheme and host from the reverse proxy', function () {
    $request = Request::create('http://origin.internal/_test/trusted-proxy', server: [
        'HTTPS' => 'off',
        'HTTP_HOST' => 'origin.internal',
        'HTTP_X_FORWARDED_HOST' => 'lms.fiskomlab.com',
        'HTTP_X_FORWARDED_PROTO' => 'https',
        'REMOTE_ADDR' => '127.0.0.1',
    ]);

    $handledRequest = (new TrustProxies)->handle($request, fn (Request $request) => $request);

    expect($handledRequest->getHost())->toBe('lms.fiskomlab.com')
        ->and($handledRequest->isSecure())->toBeTrue()
        ->and($handledRequest->getScheme())->toBe('https');
});
