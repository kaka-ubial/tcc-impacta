<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\Doacao;
use App\Models\Transferencia;
use Inertia\Inertia;
use Inertia\Response;

class PainelController extends Controller
{
    public function index(): Response
    {
        $id = auth()->user()->instituicao->usuario_id;

        $doacoesPendentes = Doacao::where('instituicao_id', $id)->where('status', 'pendente')->count();

        $transferenciasPendentes = Transferencia::where(function ($q) use ($id) {
            $q->where('instituicao_destino_id', $id)->where('status', 'pendente');
        })->orWhere(function ($q) use ($id) {
            $q->where('instituicao_origem_id', $id)->where('status', 'alteracao_sugerida');
        })->count();

        return Inertia::render('instituicao/painel', [
            'contadores' => [
                'doacoes_pendentes' => $doacoesPendentes,
                'transferencias_pendentes' => $transferenciasPendentes,
            ],
        ]);
    }
}
