<?php

use App\Http\Controllers\RedirectController;
use App\Http\Middleware\EnsureInstitutionIsApproved;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Actions\Auth\ValidateRegisterStepOne;
use Inertia\Inertia;
use App\Http\Controllers\Admin\InstitutionCheckController;
use App\Http\Middleware\CheckAdmin;
use App\Http\Controllers\Instituicao\InstituicaoController;


Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/redirect', RedirectController::class)->middleware('auth')->name('redirect');

Route::post('/validate/register-step-one', ValidateRegisterStepOne::class);

Route::middleware(['auth', 'verified', EnsureInstitutionIsApproved::class])->group(function () {
    Route::get('instituicoes', [InstituicaoController::class, 'index'])->name('instituicoes.index');
    Route::get('instituicoes/{id}', [InstituicaoController::class, 'show'])->name('instituicoes.show');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('waiting-validation', function () {
        return auth()->user()->instituicao?->isApproved()
            ? redirect()->route('instituicoes.index')
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
            : redirect()->route('instituicoes.index');
    })->name('rejected');

});

Route::middleware(['auth', CheckAdmin::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('institutions', [InstitutionCheckController::class, 'index'])->name('institutions.index');
    Route::post('institutions/{instituicao}/approve', [InstitutionCheckController::class, 'approve'])->name('institutions.approve');
    Route::post('institutions/{instituicao}/reject', [InstitutionCheckController::class, 'reject'])->name('institutions.reject');
});

require __DIR__.'/settings.php';
