<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstitutionIsApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user || $user->tipo_usuario !== 'instituicao') {
            return $next($request);
        }

        // Sempre recarrega a relação (em vez de só quando ausente): o status
        // pode ter mudado desde que o usuário/model foi resolvido — inclusive
        // dentro do mesmo processo (guard cacheado, fila, Octane).
        $user->load('instituicao');

        $status = $user->instituicao?->status;

        if ($request->is('api/*')) {
            if ($status !== 'approved') {
                abort(403, match ($status) {
                    'pending' => 'Sua instituição ainda está aguardando aprovação.',
                    'rejected' => 'Sua instituição teve o cadastro rejeitado.',
                    default => 'Sua instituição ainda não foi validada.',
                });
            }

            return $next($request);
        }

        if ($request->routeIs(['logout', 'profile.*'])) {
            return $next($request);
        }

        switch ($status) {
            case 'pending':
                if (! $request->routeIs('waiting-validation')) {
                    return redirect()->route('waiting-validation');
                }
                break;
            case 'rejected':
                if (! $request->routeIs('rejected')) {
                    return redirect()->route('rejected');
                }
                break;
            default:
                if ($status === null) {
                    return redirect()->route('waiting-validation');
                }
                break;
        }

        return $next($request);
    }
}
