<?php

namespace App\Actions\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use Illuminate\Support\Facades\Validator;
use App\Models\Instituicao;
use App\Models\Analise;
use Illuminate\Support\Facades\DB;

class EvaluateInstitutionAction 
{
    public function execute(Instituicao $instituicao, string $status, ?string $motivo, int $adminId): void
    {
        DB::transaction(function () use ($instituicao, $status, $motivo, $adminId) {
            Analise::create([
                'instituicao_id' => $instituicao->usuario_id,
                'admin_id'    => $adminId,
                'status'      => $status,
                'observacoes'    => $motivo,
            ]);
            $instituicao->update(['status' => $status]);
        });
    }
}