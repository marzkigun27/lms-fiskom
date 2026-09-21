<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE questions MODIFY COLUMN answer_type ENUM('text', 'code', 'file') NOT NULL DEFAULT 'text'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE questions MODIFY COLUMN answer_type ENUM('text', 'code') NOT NULL DEFAULT 'text'");
        }
    }
};
