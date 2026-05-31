<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transferencias', function (Blueprint $table) {
            $table->dateTime('data_hora')->nullable()->after('status');
            $table->dateTime('data_hora_sugerida')->nullable()->after('data_hora');
            $table->enum('tipo', ['coleta', 'entrega'])->default('entrega')->after('data_hora_sugerida');
            $table->string('endereco_referencia')->nullable()->after('tipo');
            $table->foreignId('horario_disponivel_id')->nullable()->constrained('horarios_disponiveis')->nullOnDelete()->after('endereco_referencia');
        });
    }

    public function down(): void
    {
        Schema::table('transferencias', function (Blueprint $table) {
            $table->dropForeign(['horario_disponivel_id']);
            $table->dropColumn(['data_hora', 'data_hora_sugerida', 'tipo', 'endereco_referencia', 'horario_disponivel_id']);
        });
    }
};
