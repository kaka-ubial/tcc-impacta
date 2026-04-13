<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\UserRedirectService;
use Illuminate\Support\Facades\Auth;

class RedirectController extends Controller
{
    public function __invoke(UserRedirectService $redirectService)
    {
        return redirect($redirectService->getRedirectRoute(auth()->user()));
    }
}
