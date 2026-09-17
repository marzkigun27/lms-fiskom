<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoQuestionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $module = Module::first();
        if (! $module) {
            $this->command->error('No module found! Please create a module first.');

            return;
        }

        $assistant = User::whereHas('roles', fn ($q) => $q->where('name', 'assistant'))->first() ?? User::first();
        $adminId = $assistant->id ?? 1;

        $sessionTypes = [
            'preliminary' => 'Tugas Pendahuluan',
            'initial_task' => 'Tugas Awal',
            'journal' => 'Jurnal',
            'independent_task' => 'Tugas Akhir',
        ];

        // Clear existing questions for this module to avoid duplicates
        Question::where('module_id', $module->id)->forceDelete();

        foreach ($sessionTypes as $type => $label) {
            for ($i = 1; $i <= 3; $i++) {
                Question::create([
                    'module_id' => $module->id,
                    'session_type' => $type,
                    'description' => "Ini adalah soal percobaan untuk {$label} modul {$module->code}. Silakan baca referensi terkait. Pastikan output sesuai dengan yang diminta dan tidak mengandung plagiasi.",
                    'answer_type' => $i === 3 ? 'code' : 'text',
                    'programming_language' => $i === 3 ? 'python' : null,
                    'order_number' => $i,
                    'is_required' => true,
                    'status' => 'published',
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ]);
            }
        }

        $this->command->info("Seeded 12 demo questions for Module {$module->code}.");
    }
}
