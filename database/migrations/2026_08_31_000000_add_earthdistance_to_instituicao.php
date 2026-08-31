<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;


return new class extends Migration
{
    public function up(): void
    {
        match (DB::getDriverName()) {
            'pgsql' => $this->enablePostgres(),
            default => null,
        };
    }

    public function down(): void
    {
        match (DB::getDriverName()) {
            'pgsql' => DB::statement('DROP INDEX IF EXISTS instituicao_earth_idx'),
            // cube/earthdistance ficam instalados no down() — outros objetos
            // do banco podem depender deles; extensões não são exclusivas
            // desta feature.
            default => null,
        };
    }

    private function enablePostgres(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS cube');
        DB::statement('CREATE EXTENSION IF NOT EXISTS earthdistance');
        DB::statement('
            CREATE INDEX IF NOT EXISTS instituicao_earth_idx
                ON instituicao
                USING gist (ll_to_earth(latitude, longitude))
        ');
    }
};
