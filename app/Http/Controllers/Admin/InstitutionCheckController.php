<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Enums\InstituicaoStatus;
use App\Models\Analise;
use App\Models\Instituicao;
use Illuminate\Support\Facades\DB;
use App\Actions\Auth\EvaluateInstitutionAction;
use App\Http\Requests\Admin\RejectInstitutionRequest;

class InstitutionCheckController extends Controller
{
    public function index() {
        $instituicoes = Instituicao::where('status', InstituicaoStatus::Pending)->with('usuario')->get();
        $stats = Instituicao::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();
        return Inertia::render('admin/institutions-list', [
            'instituicoes' => $instituicoes,
            'status_options' => InstituicaoStatus::values(),
            'stats' => [
                'pending' => $stats['pending'] ?? 0,
                'approved' => $stats['approved'] ?? 0,
                'rejected' => $stats['rejected'] ?? 0,
            ]
        ]);
    }

    public function approve(Instituicao $instituicao, EvaluateInstitutionAction $action) {
        $action->execute($instituicao, InstituicaoStatus::Approved, 'Instituição Aprovada', auth()->id());
        return back()->with('message', 'Instituição aprovada com sucesso.');
    }

    public function reject(RejectInstitutionRequest $request, Instituicao $instituicao, EvaluateInstitutionAction $action) {
        $action->execute($instituicao, InstituicaoStatus::Rejected, $request->motivo, auth()->id());
        return back()->with('message', 'Instituição rejeitada com sucesso.');
    }
}
