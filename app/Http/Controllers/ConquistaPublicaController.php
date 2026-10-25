<?php

namespace App\Http\Controllers;

use App\Models\DoadorBadge;
use Illuminate\Contracts\View\View;

/**
 * Página pública de um badge compartilhado. É Blade (e não Inertia) de
 * propósito: os crawlers do WhatsApp, X e Facebook não executam JS, então
 * as meta tags Open Graph precisam vir no HTML do servidor.
 */
class ConquistaPublicaController extends Controller
{
    public function __invoke(string $token): View
    {
        $conquista = DoadorBadge::with(['badge', 'doador'])
            ->where('compartilhavel_token', $token)
            ->firstOrFail();

        $doador = $conquista->doador;

        return view('conquistas.show', [
            'badge' => $conquista->badge,
            'quem' => $doador->exibir_em_transparencia ? $doador->nome_completo : 'Um doador da plataforma',
            'conquistadoEm' => $conquista->conquistado_em,
            'imagem' => url($conquista->badge->imagem_url),
            'url' => route('conquistas.publica', $token),
        ]);
    }
}
