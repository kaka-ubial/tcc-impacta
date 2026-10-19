<?php

namespace App\Http\Controllers\Instituicao;

use App\Exceptions\HorarioException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreHorarioRequest;
use App\Models\HorarioDisponivel;
use App\Services\HorarioService;

class HorarioController extends Controller
{
    public function __construct(private readonly HorarioService $horarios) {}

    public function store(StoreHorarioRequest $request)
    {
        $this->horarios->store($request->validated(), auth()->user()->instituicao);

        return back();
    }

    public function destroy(HorarioDisponivel $horario)
    {
        try {
            $this->horarios->destroy($horario, auth()->user()->instituicao);
        } catch (HorarioException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back();
    }
}
