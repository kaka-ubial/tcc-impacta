<?php

use App\Http\Controllers\RedirectController;
use App\Http\Middleware\EnsureInstitutionIsApproved;
use App\Http\Controllers\Instituicao\PainelController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Actions\Auth\ValidateRegisterStepOne;
use Inertia\Inertia;
use App\Http\Controllers\Admin\InstitutionCheckController;
use App\Http\Controllers\Doador\DoacaoController;
use App\Http\Controllers\Doador\PerfilController as DoadorPerfilController;
use App\Http\Controllers\Instituicao\DoacaoController as InstituicaoDoacaoController;
use App\Http\Controllers\Instituicao\DoadorController as InstituicaoDoadorController;
use App\Http\Controllers\Instituicao\HorarioController;
use App\Http\Controllers\Instituicao\AgendaController;
use App\Http\Controllers\Instituicao\InstituicaoController;
use App\Http\Controllers\Instituicao\AvaliacaoController;
use App\Http\Controllers\Instituicao\TransferenciaController;
use App\Http\Controllers\NecessidadeController;
use App\Http\Controllers\NotificacaoController;
use App\Http\Controllers\TransparenciaController;
use App\Http\Middleware\CheckNecessidadeOwnership;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'stats' => [
            'doadoras'     => \App\Models\Doador::count(),
            'instituicoes' => \App\Models\Instituicao::where('status', 'approved')->count(),
            'doacoes'      => \App\Models\Doacao::count(),
        ],
    ]);
})->name('home');

Route::get('transparencia', [TransparenciaController::class, 'index'])
    ->middleware('throttle:60,1')
    ->name('transparencia');

Route::get('/redirect', RedirectController::class)->middleware('auth')->name('redirect');

Route::post('/validate/register-step-one', ValidateRegisterStepOne::class);

Route::middleware(['auth', 'verified', 'user_type:instituicao', EnsureInstitutionIsApproved::class])->prefix('instituicao')->name('instituicao.')->group(function () {

    Route::get('painel', [PainelController::class, 'index'])->name('painel');

    Route::get('horarios', [HorarioController::class, 'index'])->name('horarios.index');
    Route::post('horarios', [HorarioController::class, 'store'])->name('horarios.store');
    Route::delete('horarios/{horario}', [HorarioController::class, 'destroy'])->name('horarios.destroy');

    Route::get('agenda', [AgendaController::class, 'index'])->name('agenda.index');
    Route::post('agendamentos/{agendamento}/sugerir', [AgendaController::class, 'sugerirAlteracao'])->name('agenda.sugerir');

    Route::get('necessidades', [NecessidadeController::class, 'index'])->name('necessidades.index');
    Route::post('necessidades', [NecessidadeController::class, 'store'])->name('necessidades.store');
    Route::get('necessidades/create', [NecessidadeController::class, 'create'])->name('necessidades.create');
    Route::put('necessidades/{id}', [NecessidadeController::class, 'update'])->name('necessidades.update')->middleware(CheckNecessidadeOwnership::class);
    Route::delete('necessidades/{id}', [NecessidadeController::class, 'destroy'])->name('necessidades.destroy')->middleware(CheckNecessidadeOwnership::class);

    Route::get('doacoes', [InstituicaoDoacaoController::class, 'index'])->name('doacoes.index');
    Route::post('doacoes/{doacao}/confirm', [InstituicaoDoacaoController::class, 'confirm'])->name('doacoes.confirm');
    Route::post('doacoes/{doacao}/reject', [InstituicaoDoacaoController::class, 'reject'])->name('doacoes.reject');
    Route::post('doacoes/{doacao}/deliver', [InstituicaoDoacaoController::class, 'deliver'])->name('doacoes.deliver');
    Route::post('doacoes/{doacao}/notDelivered', [InstituicaoDoacaoController::class, 'notDelivered'])->name('doacoes.notDelivered');
    Route::post('doacoes/{doacao}/avaliar', [AvaliacaoController::class, 'store'])->name('doacoes.avaliar');

    Route::get('transferencias', [TransferenciaController::class, 'index'])->name('transferencias.index');
    Route::post('transferencias', [TransferenciaController::class, 'store'])->name('transferencias.store');
    Route::post('transferencias/{transferencia}/confirmar', [TransferenciaController::class, 'confirmar'])->name('transferencias.confirmar');
    Route::post('transferencias/{transferencia}/recusar', [TransferenciaController::class, 'recusar'])->name('transferencias.recusar');
    Route::post('transferencias/{transferencia}/entregar', [TransferenciaController::class, 'entregar'])->name('transferencias.entregar');
    Route::post('transferencias/{transferencia}/cancelar', [TransferenciaController::class, 'cancelar'])->name('transferencias.cancelar');
    Route::post('transferencias/{transferencia}/nao-entregue', [TransferenciaController::class, 'naoEntregue'])->name('transferencias.naoEntregue');
    Route::post('transferencias/{transferencia}/sugerir', [TransferenciaController::class, 'sugerirAlteracao'])->name('transferencias.sugerir');
    Route::post('transferencias/{transferencia}/sugestao/aceitar', [TransferenciaController::class, 'aceitarSugestao'])->name('transferencias.aceitarSugestao');
    Route::post('transferencias/{transferencia}/sugestao/recusar', [TransferenciaController::class, 'recusarSugestao'])->name('transferencias.recusarSugestao');

    Route::get('doadores/{doador}', [InstituicaoDoadorController::class, 'show'])->name('doadores.show');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('instituicoes', [InstituicaoController::class, 'index'])->name('instituicoes.index');
    Route::get('instituicoes/{id}', [InstituicaoController::class, 'show'])->name('instituicoes.show');
});

Route::middleware(['auth', 'verified', 'user_type:doador'])->group(function () {

    Route::get('perfil', [DoadorPerfilController::class, 'show'])->name('doador.perfil');

    Route::get('doacoes', [DoacaoController::class, 'index'])->name('doacoes.index');
    Route::post('doacoes', [DoacaoController::class, 'store'])->name('doacoes.store');
    Route::post('doacoes/{doacao}/cancel', [DoacaoController::class, 'cancel'])->name('doacoes.cancel');
    Route::post('doacoes/{doacao}/sugestao/aceitar', [DoacaoController::class, 'aceitarSugestao'])->name('doacoes.aceitarSugestao');
    Route::post('doacoes/{doacao}/sugestao/recusar', [DoacaoController::class, 'recusarSugestao'])->name('doacoes.recusarSugestao');

});

Route::middleware(['auth', 'user_type:admin'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('institutions', [InstitutionCheckController::class, 'index'])->name('institutions.index');
    Route::post('institutions/{instituicao}/approve', [InstitutionCheckController::class, 'approve'])->name('institutions.approve');
    Route::post('institutions/{instituicao}/reject', [InstitutionCheckController::class, 'reject'])->name('institutions.reject');
    
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('notificacoes', [NotificacaoController::class, 'index'])->name('notificacoes.index');

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
