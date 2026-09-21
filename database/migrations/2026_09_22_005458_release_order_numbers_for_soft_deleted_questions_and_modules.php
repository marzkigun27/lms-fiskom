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
        DB::table('questions')
            ->whereNotNull('deleted_at')
            ->where('order_number', '>', 0)
            ->update(['order_number' => DB::raw('-id')]);

        DB::table('modules')
            ->whereNotNull('deleted_at')
            ->where('order_number', '>', 0)
            ->update(['order_number' => DB::raw('-id')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op as soft-deleted items keep negative order numbers
    }
};
