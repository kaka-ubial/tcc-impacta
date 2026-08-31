<?php

namespace App\Models;

use App\Enums\InstituicaoStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

#[Fillable(['usuario_id', 'nome_fantasia', 'razao_social', 'cnpj', 'telefone', 'endereco_completo', 'descricao', 'latitude', 'longitude', 'status'])]
class Instituicao extends Model
{
    use HasFactory;

    protected $table = 'instituicao';

    protected $primaryKey = 'usuario_id';

    public $incrementing = false;

    protected function casts(): array
    {
        return [
            'status' => InstituicaoStatus::class,
            'latitude' => 'float',
            'longitude' => 'float',
            'distancia_km' => 'float',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function analises(): HasMany
    {
        return $this->hasMany(Analise::class, 'instituicao_id', 'usuario_id');
    }

    public function isPending(): bool
    {
        return $this->status === InstituicaoStatus::Pending;
    }

    public function isApproved(): bool
    {
        return $this->status === InstituicaoStatus::Approved;
    }

    public function isRejected(): bool
    {
        return $this->status === InstituicaoStatus::Rejected;
    }

    public function scopeVisible(Builder $query): void
    {
        $query->whereIn('status', [InstituicaoStatus::Pending, InstituicaoStatus::Approved]);
    }

    public function causas(): BelongsToMany
    {
        return $this->belongsToMany(Causa::class, 'usuario_causa', 'user_id', 'causa_id', 'usuario_id');
    }

    public function necessidades(): HasMany
    {
        return $this->hasMany(Necessidade::class, 'instituicao_id', 'usuario_id');
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(HorarioDisponivel::class, 'instituicao_id', 'usuario_id');
    }

    /**
     * RF4 — busca por proximidade. Adiciona a coluna `distancia_km` (em
     * quilômetros, distância em grande círculo) relativa ao ponto ($lat,
     * $lng), calculada no banco. Em pgsql usa a extensão `earthdistance`
     * (ll_to_earth/earth_distance — https://www.postgresql.org/docs/current/earthdistance.html),
     * acelerada pelo índice GiST criado em
     * `2026_08_31_000000_add_earthdistance_to_instituicao.php`. Em qualquer
     * outro driver (SQLite, usado em CI) cai num haversine equivalente
     * escrito em SQL puro, para manter o mesmo comportamento sem a extensão.
     */
    public function scopeSelectDistance(Builder $query, float $lat, float $lng): Builder
    {
        return $query->addSelect('instituicao.*')->selectRaw(
            self::distanceExpression().' as distancia_km',
            self::distanceBindings($lat, $lng)
        );
    }

    /**
     * Restringe a um raio de $km ao redor de ($lat, $lng). Instituições sem
     * latitude/longitude cadastrada são excluídas (não há como saber a
     * distância).
     *
     * O parâmetro de raio precisa de CAST(? AS REAL) no SQLite: PDO liga
     * valores PHP float como TEXT (não existe PDO::PARAM_FLOAT), e o SQLite
     * compara operandos de storage class diferentes pela classe antes do
     * valor — qualquer REAL é "menor" que qualquer TEXT, então uma
     * comparação `<expressão REAL> <= <parâmetro bind como TEXT>` seria
     * sempre verdadeira, sem CAST (confirmado testando isoladamente: o
     * mesmo filtro com km como int funciona, com km como float sem CAST
     * devolve todas as linhas). No pgsql o driver já envia o parâmetro com
     * o tipo correto, então o CAST não é necessário ali.
     */
    public function scopeWithinRadius(Builder $query, float $lat, float $lng, float $km): Builder
    {
        $comparison = match (DB::getDriverName()) {
            'pgsql' => '<= ?',
            default => '<= CAST(? AS REAL)',
        };

        return $query->whereNotNull('instituicao.latitude')
            ->whereNotNull('instituicao.longitude')
            ->whereRaw(
                self::distanceExpression().' '.$comparison,
                [...self::distanceBindings($lat, $lng), $km]
            );
    }

    /**
     * Ordena pela distância até ($lat, $lng), mais próxima primeiro.
     * Instituições sem localização vão sempre por último — calculado via um
     * flag 0/1 em vez de depender de NULLS LAST (sintaxe que pgsql suporta
     * mas cujo comportamento padrão difere do SQLite).
     */
    public function scopeOrderByDistance(Builder $query, float $lat, float $lng): Builder
    {
        return $query
            ->orderByRaw('CASE WHEN instituicao.latitude IS NULL OR instituicao.longitude IS NULL THEN 1 ELSE 0 END')
            ->orderByRaw(self::distanceExpression().' asc', self::distanceBindings($lat, $lng));
    }

    private static function distanceExpression(): string
    {
        return match (DB::getDriverName()) {
            'pgsql' => 'earth_distance(ll_to_earth(instituicao.latitude, instituicao.longitude), ll_to_earth(?, ?)) / 1000',
            // Haversine em SQL puro (acos/cos/sin/radians) — mesmo resultado
            // sem earthdistance, usado em CI (SQLite). min/max clampam
            // erros de arredondamento de ponto flutuante que levariam
            // acos() a receber um argumento fora de [-1, 1].
            default => '(6371 * acos(min(1.0, max(-1.0,
                cos(radians(?)) * cos(radians(instituicao.latitude)) * cos(radians(instituicao.longitude) - radians(?))
                + sin(radians(?)) * sin(radians(instituicao.latitude))
            ))))',
        };
    }

    private static function distanceBindings(float $lat, float $lng): array
    {
        return match (DB::getDriverName()) {
            'pgsql' => [$lat, $lng],
            default => [$lat, $lng, $lat],
        };
    }
}
