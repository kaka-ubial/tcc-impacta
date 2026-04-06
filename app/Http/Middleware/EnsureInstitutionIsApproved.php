<?php

namespace App\Http\Middleware;

use Illuminate\Support\Facades\Log;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstitutionIsApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if(!$user || $user->tipo_usuario !== 'instituicao') {
            return $next($request);
        }

        if(!$user->relationLoaded('instituicao')){
            $user->load('instituicao');
        }

        $status = $user->instituicao?->status;

        if ($request->routeIs(['logout', 'profile.*'])) {
            return $next($request);
        }

        switch ($status) {
            case 'pending':
                if (!$request->routeIs('waiting-validation')) {
                    return redirect()->route('waiting-validation');
                }
                break;
            case 'rejected':
                if (!$request->routeIs('rejected')) {
                    return redirect()->route('rejected');
                }
                break;
        }
        return $next($request);
    }
}
