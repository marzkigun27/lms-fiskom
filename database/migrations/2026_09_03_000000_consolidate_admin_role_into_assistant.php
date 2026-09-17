<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            if (Schema::hasColumn('users', 'user_type')) {
                DB::table('users')->where('user_type', 'admin')->update(['user_type' => 'assistant']);
            }

            if (! Schema::hasTable('roles') || ! Schema::hasTable('model_has_roles')) {
                return;
            }

            $assistantRole = DB::table('roles')->where('name', 'assistant')->where('guard_name', 'web')->first();
            $adminRole = DB::table('roles')->where('name', 'admin')->where('guard_name', 'web')->first();

            if (! $assistantRole || ! $adminRole) {
                return;
            }

            $adminAssignments = DB::table('model_has_roles')->where('role_id', $adminRole->id)->get();
            foreach ($adminAssignments as $assignment) {
                DB::table('model_has_roles')->updateOrInsert(
                    [
                        'role_id' => $assistantRole->id,
                        'model_type' => $assignment->model_type,
                        'model_id' => $assignment->model_id,
                    ],
                    []
                );
            }
            DB::table('model_has_roles')->where('role_id', $adminRole->id)->delete();
            DB::table('roles')->where('id', $adminRole->id)->delete();
        });
    }

    public function down(): void
    {
        // Role consolidation is intentionally not reversed to avoid reintroducing admin access.
    }
};
