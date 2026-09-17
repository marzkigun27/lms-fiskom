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
        Schema::table('practicum_schedules', function (Blueprint $table) {
            $table->index('module_id');
            $table->dropUnique(['module_id', 'class_id']);
            $table->foreignId('class_id')->nullable()->change();
            $table->foreignId('weekly_schedule_id')->nullable()->constrained()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('practicum_schedules', function (Blueprint $table) {
            $table->dropForeign(['weekly_schedule_id']);
            $table->dropColumn('weekly_schedule_id');
            // Reverting the nullable change is hard because data might have nulls, but for rollback:
            // $table->foreignId('class_id')->nullable(false)->change();
            // $table->unique(['module_id', 'class_id']);
        });
    }
};
