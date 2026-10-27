<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\SalvarLayoutEstatisticasRequest;
use App\Services\EstatisticasInstituicaoService;
use Illuminate\Http\RedirectResponse;
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

        $user = $request->user();
        $layout = $this->estatisticas->layout($user->preferencias['estatisticas'] ?? null);

        return Inertia::render('instituicao/estatisticas', [
            'estatisticas' => $this->estatisticas->gerar(
                $user->instituicaoId(),
                $validated['periodo'] ?? $layout['periodo'],
            ),
            'layout' => $layout,
        ]);
    }

    public function salvarLayout(SalvarLayoutEstatisticasRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->preferencias = [
            ...$user->preferencias ?? [],
            'estatisticas' => $this->estatisticas->layout($request->validated()),
        ];
        $user->save();

        return back()->with('success', 'Layout das estatísticas salvo.');
    }
}
