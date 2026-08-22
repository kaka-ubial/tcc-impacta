<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doador', function (Blueprint $table) {
            $table->boolean('exibir_em_transparencia')->default(false)->after('pontuacao_gamificacao');
        });
    }

    public function down(): void
    {
        Schema::table('doador', function (Blueprint $table) {
            $table->dropColumn('exibir_em_transparencia');
        });
    }
};
