<?php

namespace App\Services;

use App\Enums\UserType;
use App\Models\Instituicao;
use App\Models\User;
use Illuminate\Contracts\Pagination\Paginator;

class InstituicaoQueryService
{
    private const PER_PAGE = 12;

    private const MIN_RADIUS_KM = 1;

    private const MAX_RADIUS_KM = 500;

    /**
     * @param  array{search?: ?string, causa?: ?int, categoria?: ?int, raio?: ?int}  $filters
     */
    public function search(User $user, array $filters): Paginator
    {
        $search = $filters['search'] ?? null;
        $causaId = $filters['causa'] ?? null;
        $categoriaId = $filters['categoria'] ?? null;
        $raioKm = $this->clampRadius($filters['raio'] ?? null);

        $origin = $this->originFor($user);

        return Instituicao::with('causas')
            ->withCount(['necessidades as necessidades_ativas_count' => function ($query) {
                $query->whereColumn('quantidade_atual', '<', 'quantidade_objetivo');
            }])
            ->visible()
            ->when($user->tipo_usuario === UserType::Instituicao, fn ($q) => $q
                ->where('usuario_id', '!=', $user->instituicaoId()))
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $term = '%'.$search.'%';
                $q->where('nome_fantasia', 'ilike', $term)
                    ->orWhere('endereco_completo', 'ilike', $term)
                    ->orWhereHas('causas', fn ($q) => $q->where('nome', 'ilike', $term));
            }))
            ->when($causaId, fn ($q) => $q->whereHas('causas', fn ($q) => $q->where('causas.id', $causaId)))
            ->when($categoriaId, fn ($q) => $q->whereHas(
                'necessidades',
                fn ($q) => $q->where('categoria_id', $categoriaId)
                    ->whereColumn('quantidade_atual', '<', 'quantidade_objetivo')
            ))
            ->when($origin, fn ($q) => $q->selectDistance($origin[0], $origin[1]))
            ->when($origin && $raioKm, fn ($q) => $q->withinRadius($origin[0], $origin[1], $raioKm))
            ->when(
                $origin && $raioKm,
                fn ($q) => $q->orderByDistance($origin[0], $origin[1]),
                fn ($q) => $q->orderBy('nome_fantasia')
            )
            ->simplePaginate(self::PER_PAGE)
            ->withQueryString();
    }

    private function originFor(User $user): ?array
    {
        $doador = $user->tipo_usuario === UserType::Doador ? $user->doador : null;

        if (! $doador || $doador->latitude === null || $doador->longitude === null) {
            return null;
        }

        return [$doador->latitude, $doador->longitude];
    }

    private function clampRadius(?int $raioKm): ?int
    {
        if ($raioKm === null) {
            return null;
        }

        return max(self::MIN_RADIUS_KM, min(self::MAX_RADIUS_KM, $raioKm));
    }
}
