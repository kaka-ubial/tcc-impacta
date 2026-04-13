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
        Schema::table('instituicao', function (Blueprint $table) {
            $table->index('status');
            $table->index('nome_fantasia');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('instituicao', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['nome_fantasia']);
        });
    }
};
