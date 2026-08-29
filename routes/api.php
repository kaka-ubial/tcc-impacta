<?php

use App\Http\Controllers\Api\Admin\InstitutionController;
use App\Http\Controllers\Api\Admin\UserController as ApiAdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DoacaoController;
use App\Http\Controllers\Api\Doador\PerfilController;
use App\Http\Controllers\Api\HorarioController;
use App\Http\Controllers\Api\Instituicao\AgendaController;
use App\Http\Controllers\Api\Instituicao\AvaliacaoController;
use App\Http\Controllers\Api\Instituicao\DoacaoController as InstituicaoDoacaoController;
use App\Http\Controllers\Api\Instituicao\DoadorController as InstituicaoDoadorController;
use App\Http\Controllers\Api\Instituicao\TransferenciaController;
use App\Http\Controllers\Api\InstituicaoController;
use App\Http\Controllers\Api\NecessidadeController;
use App\Http\Middleware\CheckNecessidadeOwnership;
use App\Http\Middleware\EnsureInstitutionIsApproved;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| API REST/JSON stateless, autenticada por token (Laravel Sanctum). Existe
| em paralelo à app Inertia (routes/web.php), que continua servindo a UI
| por sessão/cookie sem nenhuma alteração de comportamento.
|
*/

Route::post('login', [AuthController::class, 'login'])->name('api.login');
Route::post('register', [AuthController::class, 'register'])->name('api.register');

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('me', [AuthController::class, 'me'])->name('api.me');
    Route::post('logout', [AuthController::class, 'logout'])->name('api.logout');

    Route::get('instituicoes', [InstituicaoController::class, 'index'])->name('api.instituicoes.index');
    Route::get('instituicoes/recomendadas', [InstituicaoController::class, 'recomendadas'])->name('api.instituicoes.recomendadas');
    Route::get('instituicoes/{id}', [InstituicaoController::class, 'show'])->name('api.instituicoes.show');

    Route::middleware('user_type:doador')->group(function () {
        Route::get('perfil', [PerfilController::class, 'show'])->name('api.doador.perfil');

        Route::get('doacoes', [DoacaoController::class, 'index'])->name('api.doacoes.index');
        Route::post('doacoes', [DoacaoController::class, 'store'])->name('api.doacoes.store');
        Route::post('doacoes/{doacao}/cancel', [DoacaoController::class, 'cancel'])->name('api.doacoes.cancel');
        Route::post('doacoes/{doacao}/sugestao/aceitar', [DoacaoController::class, 'aceitarSugestao'])->name('api.doacoes.aceitarSugestao');
        Route::post('doacoes/{doacao}/sugestao/recusar', [DoacaoController::class, 'recusarSugestao'])->name('api.doacoes.recusarSugestao');
    });

    Route::middleware(['user_type:instituicao', EnsureInstitutionIsApproved::class])->group(function () {
        Route::get('horarios', [HorarioController::class, 'index'])->name('api.horarios.index');
        Route::post('horarios', [HorarioController::class, 'store'])->name('api.horarios.store');
        Route::delete('horarios/{horario}', [HorarioController::class, 'destroy'])->name('api.horarios.destroy');

        Route::get('necessidades', [NecessidadeController::class, 'index'])->name('api.necessidades.index');
        Route::post('necessidades', [NecessidadeController::class, 'store'])->name('api.necessidades.store');
        Route::put('necessidades/{id}', [NecessidadeController::class, 'update'])
            ->middleware(CheckNecessidadeOwnership::class)
            ->name('api.necessidades.update');
        Route::delete('necessidades/{id}', [NecessidadeController::class, 'destroy'])
            ->middleware(CheckNecessidadeOwnership::class)
            ->name('api.necessidades.destroy');

        Route::get('instituicao/doacoes', [InstituicaoDoacaoController::class, 'index'])->name('api.instituicao.doacoes.index');
        Route::post('instituicao/doacoes/{doacao}/confirm', [InstituicaoDoacaoController::class, 'confirm'])->name('api.instituicao.doacoes.confirm');
        Route::post('instituicao/doacoes/{doacao}/reject', [InstituicaoDoacaoController::class, 'reject'])->name('api.instituicao.doacoes.reject');
        Route::post('instituicao/doacoes/{doacao}/deliver', [InstituicaoDoacaoController::class, 'deliver'])->name('api.instituicao.doacoes.deliver');
        Route::post('instituicao/doacoes/{doacao}/notDelivered', [InstituicaoDoacaoController::class, 'notDelivered'])->name('api.instituicao.doacoes.notDelivered');
        Route::post('instituicao/doacoes/{doacao}/avaliar', [AvaliacaoController::class, 'store'])->name('api.instituicao.doacoes.avaliar');

        Route::get('transferencias', [TransferenciaController::class, 'index'])->name('api.transferencias.index');
        Route::post('transferencias', [TransferenciaController::class, 'store'])->name('api.transferencias.store');
        Route::post('transferencias/{transferencia}/confirmar', [TransferenciaController::class, 'confirmar'])->name('api.transferencias.confirmar');
        Route::post('transferencias/{transferencia}/recusar', [TransferenciaController::class, 'recusar'])->name('api.transferencias.recusar');
        Route::post('transferencias/{transferencia}/entregar', [TransferenciaController::class, 'entregar'])->name('api.transferencias.entregar');
        Route::post('transferencias/{transferencia}/cancelar', [TransferenciaController::class, 'cancelar'])->name('api.transferencias.cancelar');
        Route::post('transferencias/{transferencia}/nao-entregue', [TransferenciaController::class, 'naoEntregue'])->name('api.transferencias.naoEntregue');
        Route::post('transferencias/{transferencia}/sugerir', [TransferenciaController::class, 'sugerirAlteracao'])->name('api.transferencias.sugerir');
        Route::post('transferencias/{transferencia}/sugestao/aceitar', [TransferenciaController::class, 'aceitarSugestao'])->name('api.transferencias.aceitarSugestao');
        Route::post('transferencias/{transferencia}/sugestao/recusar', [TransferenciaController::class, 'recusarSugestao'])->name('api.transferencias.recusarSugestao');

        Route::get('agenda', [AgendaController::class, 'index'])->name('api.agenda.index');
        Route::post('agendamentos/{agendamento}/sugerir', [AgendaController::class, 'sugerirAlteracao'])->name('api.agenda.sugerir');

        Route::get('instituicao/doadores/{doador}', [InstituicaoDoadorController::class, 'show'])->name('api.instituicao.doadores.show');
    });

    Route::middleware('user_type:admin')->prefix('admin')->name('api.admin.')->group(function () {
        Route::get('institutions', [InstitutionController::class, 'index'])->name('institutions.index');
        Route::post('institutions/{instituicao}/approve', [InstitutionController::class, 'approve'])->name('institutions.approve');
        Route::post('institutions/{instituicao}/reject', [InstitutionController::class, 'reject'])->name('institutions.reject');

        Route::get('users', [ApiAdminUserController::class, 'index'])->name('users.index');
        Route::get('users/{user}', [ApiAdminUserController::class, 'show'])->name('users.show');
        Route::put('doadores/{user}', [ApiAdminUserController::class, 'updateDoador'])->name('doadores.update');
        Route::put('instituicoes/{user}', [ApiAdminUserController::class, 'updateInstituicao'])->name('instituicoes.update');
        Route::patch('users/{user}/status', [ApiAdminUserController::class, 'updateStatus'])->name('users.status');
    });
});
