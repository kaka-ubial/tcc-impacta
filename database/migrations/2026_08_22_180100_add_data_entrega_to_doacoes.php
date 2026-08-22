<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doacoes', function (Blueprint $table) {
            $table->dateTime('data_entrega')->nullable()->after('status');
        });

        DB::table('doacoes')
            ->where('status', 'entregue')
            ->whereNull('data_entrega')
            ->update([
                'data_entrega' => DB::raw('(select data_hora from agendamentos where agendamentos.doacao_id = doacoes.id limit 1)'),
            ]);

        DB::table('doacoes')
            ->where('status', 'entregue')
            ->whereNull('data_entrega')
            ->update(['data_entrega' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('doacoes', function (Blueprint $table) {
            $table->dropColumn('data_entrega');
        });
    }
};
