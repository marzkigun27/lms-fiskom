<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Extend practicum_sessions.session_type to include 'feedback'
        if (DB::getDriverName() === 'mysql' && Schema::hasTable('practicum_sessions')) {
            DB::statement("ALTER TABLE practicum_sessions MODIFY session_type ENUM('initial_task', 'journal', 'independent_task', 'feedback') NOT NULL");
        }

        // 2. Add rating to feedback table
        Schema::table('feedback', function (Blueprint $table) {
            if (! Schema::hasColumn('feedback', 'rating')) {
                $table->unsignedTinyInteger('rating')->nullable()->after('module_id');
            }
        });

        // 3. Add component_scores to grades table
        Schema::table('grades', function (Blueprint $table) {
            if (! Schema::hasColumn('grades', 'component_scores')) {
                $table->json('component_scores')->nullable()->after('max_score');
            }
        });

        // 4. Create assistant_module_participants table
        if (! Schema::hasTable('assistant_module_participants')) {
            Schema::create('assistant_module_participants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assistant_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
                $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['assistant_id', 'module_id', 'participant_id'], 'ast_mod_part_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_module_participants');

        Schema::table('grades', function (Blueprint $table) {
            if (Schema::hasColumn('grades', 'component_scores')) {
                $table->dropColumn('component_scores');
            }
        });

        Schema::table('feedback', function (Blueprint $table) {
            if (Schema::hasColumn('feedback', 'rating')) {
                $table->dropColumn('rating');
            }
        });

        if (DB::getDriverName() === 'mysql' && Schema::hasTable('practicum_sessions')) {
            DB::statement("ALTER TABLE practicum_sessions MODIFY session_type ENUM('initial_task', 'journal', 'independent_task') NOT NULL");
        }
    }
};
