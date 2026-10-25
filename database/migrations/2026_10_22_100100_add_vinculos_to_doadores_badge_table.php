<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doadores_badge', function (Blueprint $table) {
            $table->unsignedBigInteger('doador_id');
            $table->unsignedBigInteger('badge_id');
            $table->timestamp('conquistado_em')->useCurrent();
            $table->string('compartilhavel_token', 64)->nullable()->unique();

            $table->unique(['doador_id', 'badge_id']);
            $table->foreign('doador_id')->references('usuario_id')->on('doador')->onDelete('cascade');
            $table->foreign('badge_id')->references('id')->on('badges')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('doadores_badge', function (Blueprint $table) {
            $table->dropForeign(['doador_id']);
            $table->dropForeign(['badge_id']);
            $table->dropUnique(['doador_id', 'badge_id']);
            $table->dropUnique(['compartilhavel_token']);
            $table->dropColumn(['doador_id', 'badge_id', 'conquistado_em', 'compartilhavel_token']);
        });
    }
};
