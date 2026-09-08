<?php

namespace App\Http\Controllers;

use App\Services\UserRedirectService;

class RedirectController extends Controller
{
    public function __invoke(UserRedirectService $redirectService)
    {
        return redirect($redirectService->getRedirectRoute(auth()->user()));
    }
}
