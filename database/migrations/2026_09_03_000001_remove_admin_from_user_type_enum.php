<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql' || ! Schema::hasColumn('users', 'user_type')) {
            return;
        }

        DB::statement("ALTER TABLE users MODIFY user_type ENUM('participant', 'assistant') NOT NULL DEFAULT 'participant'");
    }

    public function down(): void
    {
        // Do not reintroduce the removed admin role during rollback.
    }
};
