<?php

use App\Http\Controllers\RedirectController;
use App\Http\Middleware\CheckDoador;
use App\Http\Middleware\CheckInstituicao;
use App\Http\Middleware\EnsureInstitutionIsApproved;
use App\Http\Controllers\Instituicao\PainelController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Actions\Auth\ValidateRegisterStepOne;
use Inertia\Inertia;
use App\Http\Controllers\Admin\InstitutionCheckController;
use App\Http\Middleware\CheckAdmin;
use App\Http\Controllers\Instituicao\InstituicaoController;
use App\Http\Controllers\NecessidadeController;
use App\Http\Middleware\CheckNecessidadeOwnership;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/redirect', RedirectController::class)->middleware('auth')->name('redirect');

Route::post('/validate/register-step-one', ValidateRegisterStepOne::class);

Route::middleware(['auth', 'verified', CheckInstituicao::class, EnsureInstitutionIsApproved::class])->prefix('instituicao')->name('instituicao.')->group(function () {
    Route::get('painel', [PainelController::class, 'index'])->name('painel');
    Route::get('necessidades', [NecessidadeController::class, 'index'])->name('necessidades.index');
    Route::post('necessidades', [NecessidadeController::class, 'store'])->name('necessidades.store');
    Route::get('necessidades/create', [NecessidadeController::class, 'create'])->name('necessidades.create');
    Route::put('necessidades/{id}', [NecessidadeController::class, 'update'])->name('necessidades.update')->middleware(CheckNecessidadeOwnership::class);
    Route::delete('necessidades/{id}', [NecessidadeController::class, 'destroy'])->name('necessidades.destroy')->middleware(CheckNecessidadeOwnership::class);
});

Route::middleware(['auth', 'verified', CheckDoador::class])->group(function () {
    Route::get('instituicoes', [InstituicaoController::class, 'index'])->name('instituicoes.index');
    Route::get('instituicoes/{id}', [InstituicaoController::class, 'show'])->name('instituicoes.show');
});

Route::middleware(['auth', CheckAdmin::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('institutions', [InstitutionCheckController::class, 'index'])->name('institutions.index');
    Route::post('institutions/{instituicao}/approve', [InstitutionCheckController::class, 'approve'])->name('institutions.approve');
    Route::post('institutions/{instituicao}/reject', [InstitutionCheckController::class, 'reject'])->name('institutions.reject');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('waiting-validation', function () {
        return auth()->user()->instituicao?->isApproved()
            ? redirect()->route('instituicao.painel')
            : Inertia::render('auth/waiting-approval');
    })->name('waiting-validation');
    Route::get('rejected', function () {
        $analise = auth()->user()
            ->instituicao
            ->analises()
            ->latest()
            ->first();
        return auth()->user()->instituicao?->isRejected()
            ? Inertia::render('auth/rejected', ['motivo' => $analise?->observacoes])
            : redirect()->route('instituicao.painel');
    })->name('rejected');

});



require __DIR__.'/settings.php';
