<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Services\EstatisticasInstituicaoService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EstatisticasController extends Controller
{
    public function __construct(private readonly EstatisticasInstituicaoService $estatisticas) {}

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'periodo' => ['nullable', Rule::in(EstatisticasInstituicaoService::PERIODOS)],
        ]);

        return Inertia::render('instituicao/estatisticas', [
            'estatisticas' => $this->estatisticas->gerar(
                auth()->user()->instituicaoId(),
                $validated['periodo'] ?? '90d',
            ),
        ]);
    }
}
