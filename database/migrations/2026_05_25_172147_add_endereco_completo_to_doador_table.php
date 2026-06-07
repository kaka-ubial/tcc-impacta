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
        Schema::table('doador', function (Blueprint $table) {
            $table->string('endereco_completo', 500)->nullable()->after('telefone');
        });
    }

    public function down(): void
    {
        Schema::table('doador', function (Blueprint $table) {
            $table->dropColumn('endereco_completo');
        });
    }
};
