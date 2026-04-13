<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('itens_doacao', function (Blueprint $table) {
            $table->unsignedBigInteger('necessidade_id')->nullable()->after('doacao_id');
            $table->foreign('necessidade_id')->references('id')->on('necessidades')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('itens_doacao', function (Blueprint $table) {
            $table->dropForeign(['necessidade_id']);
            $table->dropColumn('necessidade_id');
        });
    }
};
