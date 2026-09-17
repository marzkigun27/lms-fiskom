<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->string('day', 20);
            $table->string('shift', 50);
            $table->timestamps();
            $table->unique(['semester_id', 'day', 'shift']);
        });
        Schema::create('weekly_schedule_assistant', function (Blueprint $table) {
            $table->foreignId('weekly_schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assistant_id')->constrained('users')->cascadeOnDelete();
            $table->primary(['weekly_schedule_id', 'assistant_id']);
        });
        Schema::create('weekly_schedule_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('weekly_schedule_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('number');
            $table->timestamps();
            $table->unique(['weekly_schedule_id', 'number']);
        });
        Schema::create('weekly_schedule_group_member', function (Blueprint $table) {
            $table->foreignId('weekly_schedule_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->primary(['weekly_schedule_group_id', 'participant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_schedule_group_member');
        Schema::dropIfExists('weekly_schedule_groups');
        Schema::dropIfExists('weekly_schedule_assistant');
        Schema::dropIfExists('weekly_schedules');
    }
};
