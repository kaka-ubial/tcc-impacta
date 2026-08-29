<?php

namespace App\Services;

use App\Enums\InstituicaoStatus;
use App\Models\Instituicao;
use App\Models\User;
use Illuminate\Support\Collection;

class RecommendationService
{
    private const LIMIT = 6;
    private const MAX_DISTANCE_KM = 50;

    public function forDonor(User $user): Collection
    {
        $doador = $user->doador;
        $donorCauseIds = $user->causas()->pluck('causas.id')->all();
        $hasLocation = $doador->latitude !== null && $doador->longitude !== null;
        $hasCauses = count($donorCauseIds) > 0;

        $institutions = Instituicao::with('causas')
            ->where('status', InstituicaoStatus::Approved)
            ->get();

        return $institutions
            ->map(function (Instituicao $inst) use ($donorCauseIds, $doador, $hasLocation, $hasCauses) {
                $distanceKm = null;
                if ($hasLocation && $inst->latitude !== null && $inst->longitude !== null) {
                    $distanceKm = $this->haversine(
                        $doador->latitude,
                        $doador->longitude,
                        $inst->latitude,
                        $inst->longitude
                    );
                }

                if (!$hasCauses) {
                    $score = $distanceKm !== null
                        ? max(0, self::MAX_DISTANCE_KM - $distanceKm) / self::MAX_DISTANCE_KM * 100
                        : 0;

                    return [
                        'instituicao' => $inst,
                        'score' => $score,
                        'causa_overlap' => 0,
                        'distancia_km' => $distanceKm,
                    ];
                }

                $instCauseIds = $inst->causas->pluck('id')->all();
                $overlap = count(array_intersect($donorCauseIds, $instCauseIds));
                $causeScore = ($overlap / max(count($donorCauseIds), 1)) * 60;
                $proximityScore = $distanceKm !== null
                    ? max(0, self::MAX_DISTANCE_KM - $distanceKm) / self::MAX_DISTANCE_KM * 40
                    : 0;

                return [
                    'instituicao' => $inst,
                    'score' => $causeScore + $proximityScore,
                    'causa_overlap' => $overlap,
                    'distancia_km' => $distanceKm,
                ];
            })
            ->filter(function ($item) use ($hasLocation, $hasCauses) {
                if ($hasCauses && $item['causa_overlap'] > 0) return true;
                if (!$hasLocation) return true;
                return $item['distancia_km'] !== null && $item['distancia_km'] <= self::MAX_DISTANCE_KM;
            })
            ->sortByDesc('score')
            ->take(self::LIMIT)
            ->map(fn ($item) => [
                'usuario_id' => $item['instituicao']->usuario_id,
                'nome_fantasia' => $item['instituicao']->nome_fantasia,
                'endereco_completo' => $item['instituicao']->endereco_completo,
                'causas' => $item['instituicao']->causas->map(fn ($c) => [
                    'id' => $c->id,
                    'nome' => $c->nome,
                    'icone' => $c->icone,
                ])->values(),
                'causa_overlap' => $item['causa_overlap'],
                'distancia_km' => $item['distancia_km'] !== null ? round($item['distancia_km'], 1) : null,
            ])
            ->values();
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
