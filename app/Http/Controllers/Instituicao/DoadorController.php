<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\Doacao;
use App\Models\Doador;
use Inertia\Inertia;
use Inertia\Response;

class DoadorController extends Controller
{
    public function show(Doador $doador): Response
    {
        $instituicaoId = auth()->user()->instituicaoId();

        $temDoacao = Doacao::where('doador_id', $doador->usuario_id)
            ->where('instituicao_id', $instituicaoId)
            ->exists();

        abort_unless($temDoacao, 403);

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
        $totalAvaliadas = $doador->doacoes()->where('status', 'entregue')->with('avaliacao')->get()->filter(fn ($d) => $d->avaliacao !== null)->count();
        $totalComInstituicao = $doador->doacoes()->where('instituicao_id', $instituicaoId)->count();

        return Inertia::render('instituicao/doadores/show', [
            'isOwnProfile' => false,
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
                    'doacoes_com_instituicao' => $totalComInstituicao,
                    'media_avaliacoes' => $totalConcluidas > 0
                        ? round($doador->doacoes()->where('status', 'entregue')->with('avaliacao')->get()->avg(fn ($d) => $d->avaliacao?->nota), 2)
                        : null,
                    'total_avaliacoes' => $totalAvaliadas,
                ],
                'doacoes_recentes' => $doador->doacoes->map(fn (Doacao $d) => [
                    'id'          => $d->id,
                    'status'      => $d->status,
                    'criado_em'   => $d->created_at?->toIso8601String(),
                    'eh_para_esta_instituicao' => $d->instituicao_id === $instituicaoId,
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
