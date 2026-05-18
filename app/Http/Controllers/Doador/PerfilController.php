<?php

namespace App\Http\Controllers\Doador;

use App\Http\Controllers\Controller;
use App\Models\Doacao;
use Inertia\Inertia;
use Inertia\Response;

class PerfilController extends Controller
{
    public function show(): Response
    {
        $doador = auth()->user()->doador;

        abort_unless($doador, 403);

        $doador->load([
            'usuario.causas',
            'doacoes' => fn ($q) => $q->where('status', 'entregue')
                ->orderBy('created_at', 'desc')
                ->limit(10),
            'doacoes.instituicao',
            'doacoes.itens.categoria',
        ]);

        $totalDoacoes = $doador->doacoes()->count();
        $totalConcluidas = $doador->doacoes()->where('status', 'entregue')->count();

        return Inertia::render('instituicao/doadores/show', [
            'isOwnProfile' => true,
            'doador' => [
                'usuario_id'            => $doador->usuario_id,
                'nome_completo'         => $doador->nome_completo,
                'email'                 => $doador->usuario->email,
                'telefone'              => $doador->telefone,
                'endereco_completo'     => $doador->endereco_completo,
                'foto_perfil'           => $doador->foto_perfil,
                'pontuacao_gamificacao' => $doador->pontuacao_gamificacao ?? 0,
                'latitude'              => $doador->latitude,
                'longitude'             => $doador->longitude,
                'membro_desde'          => $doador->created_at?->toIso8601String(),
                'causas'                => $doador->usuario->causas->map(fn ($c) => [
                    'id'    => $c->id,
                    'nome'  => $c->nome,
                    'icone' => $c->icone,
                ])->values(),
                'estatisticas' => [
                    'total_doacoes'         => $totalDoacoes,
                    'doacoes_concluidas'    => $totalConcluidas,
                    'doacoes_com_instituicao' => 0,
                ],
                'doacoes_recentes' => $doador->doacoes->map(fn (Doacao $d) => [
                    'id'          => $d->id,
                    'status'      => $d->status,
                    'criado_em'   => $d->created_at?->toIso8601String(),
                    'eh_para_esta_instituicao' => false,
                    'instituicao' => [
                        'usuario_id'    => $d->instituicao->usuario_id,
                        'nome_fantasia' => $d->instituicao->nome_fantasia,
                    ],
                    'itens' => $d->itens->map(fn ($item) => [
                        'id'         => $item->id,
                        'categoria'  => $item->categoria->nome,
                        'quantidade' => $item->quantidade,
                    ])->values(),
                ])->values(),
            ],
        ]);
    }
}
