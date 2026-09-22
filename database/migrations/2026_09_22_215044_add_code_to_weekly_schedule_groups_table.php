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
        Schema::table('weekly_schedule_groups', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->after('number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weekly_schedule_groups', function (Blueprint $table) {
            $table->dropColumn('code');
        });
    }
};
