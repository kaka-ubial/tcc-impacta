<?php

namespace App\Http\Controllers\Doador;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\DoadorBadge;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ConquistaController extends Controller
{
    /**
     * Opt-in: só depois daqui o badge ganha uma URL pública.
     */
    public function compartilhar(Request $request, Badge $badge): RedirectResponse
    {
        $conquista = $this->conquista($request, $badge);

        $conquista->compartilhavel_token ??= Str::random(40);
        $conquista->save();

        return back();
    }

    public function revogar(Request $request, Badge $badge): RedirectResponse
    {
        $conquista = $this->conquista($request, $badge);

        $conquista->update(['compartilhavel_token' => null]);

        return back();
    }

    private function conquista(Request $request, Badge $badge): DoadorBadge
    {
        abort_unless($request->user()->doador, 403);

        return DoadorBadge::where('doador_id', $request->user()->id)
            ->where('badge_id', $badge->id)
            ->firstOrFail();
    }
}
