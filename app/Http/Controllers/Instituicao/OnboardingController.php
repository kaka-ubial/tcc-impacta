<?php

namespace App\Http\Controllers\Instituicao;

use App\Exceptions\HorarioException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreHorarioRequest;
use App\Http\Resources\HorarioResource;
use App\Models\HorarioDisponivel;
use App\Services\HorarioService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(private readonly HorarioService $horarios) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $instituicao = $request->user()->instituicao;

        if ($instituicao?->isApproved()) {
            return redirect()->route('instituicao.painel');
        }

        if ($instituicao?->isRejected()) {
            return redirect()->route('rejected');
        }

        $horarios = $instituicao
            ? $instituicao->horarios()->where('ativo', true)->orderBy('dia_semana')->orderBy('hora_inicio')->get()
            : collect();

        return Inertia::render('auth/waiting-approval', [
            'nomeFantasia' => $instituicao?->nome_fantasia,
            'horarios' => HorarioResource::collection($horarios)->resolve($request),
        ]);
    }

    public function ficha(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $instituicao = $user->instituicao;

        if ($instituicao?->isApproved()) {
            return redirect()->route('instituicao.painel');
        }

        if ($instituicao?->isRejected()) {
            return redirect()->route('rejected');
        }

        abort_if($instituicao === null, 404);

        return Inertia::render('auth/registration-summary', [
            'ficha' => [
                'email' => $user->email,
                'nome_fantasia' => $instituicao->nome_fantasia,
                'razao_social' => $instituicao->razao_social,
                'cnpj' => $instituicao->cnpj,
                'telefone' => $instituicao->telefone,
                'endereco_completo' => $instituicao->endereco_completo,
                'descricao' => $instituicao->descricao,
                'causas' => $instituicao->causas()->orderBy('nome')->pluck('nome'),
            ],
            'horarios' => HorarioResource::collection(
                $instituicao->horarios()->where('ativo', true)->orderBy('dia_semana')->orderBy('hora_inicio')->get()
            )->resolve($request),
        ]);
    }

    public function storeHorario(StoreHorarioRequest $request): RedirectResponse
    {
        $instituicao = $request->user()->instituicao;

        abort_unless($instituicao?->isPending(), 403);

        $this->horarios->store($request->validated(), $instituicao);

        return back();
    }

    public function destroyHorario(Request $request, HorarioDisponivel $horario): RedirectResponse
    {
        $instituicao = $request->user()->instituicao;

        abort_unless($instituicao?->isPending(), 403);

        try {
            $this->horarios->destroy($horario, $instituicao);
        } catch (HorarioException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back();
    }
}
