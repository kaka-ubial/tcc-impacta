<?php

namespace App\Observers;

use App\Enums\InstituicaoStatus;
use App\Models\Instituicao;

class InstituicaoObserver
{
    public function created(Instituicao $instituicao): void
    {
        //
    }

    public function updating(Instituicao $instituicao): void
    {
        if ($instituicao->isRejected() && !$instituicao->isDirty('status')) {
            $instituicao->status = InstituicaoStatus::Pending;
        }
    }

    public function deleted(Instituicao $instituicao): void
    {
        //
    }

    public function restored(Instituicao $instituicao): void
    {
        //
    }

    public function forceDeleted(Instituicao $instituicao): void
    {
        //
    }
}
