<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Seeder;

class OpsModuleQuestionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $module = Module::where('code', 'OPS')->first();
        if (! $module) {
            $this->command->error("Modul dengan kode 'OPS' tidak ditemukan.");

            return;
        }

        // Hapus soal-soal sebelumnya (termasuk yang soft-deleted) untuk modul ini
        Question::withTrashed()->where('module_id', $module->id)->forceDelete();

        $assistant = User::where('user_type', 'assistant')->first() ?? User::first();

        // Tugas Awal (Initial Task)
        $initialTasks = [
            [
                'description' => 'Jelaskan perbedaan mendasar antara sinyal kontinu dan sinyal diskrit. Tuliskan jawaban Anda secara singkat dan jelas.',
                'answer_type' => 'text',
                'programming_language' => null,
            ],
            [
                'description' => 'Sebutkan tiga macam operasi dasar yang dapat dilakukan pada sinyal diskrit (minimal 3).',
                'answer_type' => 'text',
                'programming_language' => null,
            ],
        ];

        // Jurnal (Journal)
        $journals = [
            [
                'description' => 'Buatlah program sederhana untuk membangkitkan sinyal sinusoidal dengan frekuensi 100 Hz dan frekuensi sampling 1000 Hz. Tuliskan kode program pada editor yang disediakan.',
                'answer_type' => 'code',
                'programming_language' => 'python',
            ],
            [
                'description' => 'Apa yang terjadi pada sinyal jika dilakukan operasi pergeseran (shifting) sebesar n-3? Jelaskan hasil pengamatan Anda dari plot yang dihasilkan pada percobaan sebelumnya.',
                'answer_type' => 'text',
                'programming_language' => null,
            ],
        ];

        // Tugas Akhir (Independent Task)
        $independentTasks = [
            [
                'description' => 'Rancanglah sebuah filter FIR low-pass sederhana dengan menggunakan windowing (misal Rectangular atau Hamming). Tuliskan kodenya dan pastikan plot respon frekuensinya ditampilkan.',
                'answer_type' => 'code',
                'programming_language' => 'python',
            ],
        ];

        $this->seedQuestions($module->id, 'initial_task', $initialTasks, $assistant->id);
        $this->seedQuestions($module->id, 'journal', $journals, $assistant->id);
        $this->seedQuestions($module->id, 'independent_task', $independentTasks, $assistant->id);

        $this->command->info("Soal-soal untuk Modul 'OPS' berhasil di-seed.");
    }

    private function seedQuestions(int $moduleId, string $sessionType, array $questionsData, int $authorId): void
    {
        foreach ($questionsData as $index => $data) {
            Question::create([
                'module_id' => $moduleId,
                'session_type' => $sessionType,
                'description' => $data['description'],
                'answer_type' => $data['answer_type'],
                'programming_language' => $data['programming_language'],
                'order_number' => $index + 1,
                'is_required' => true,
                'status' => 'published',
                'created_by' => $authorId,
                'updated_by' => $authorId,
            ]);
        }
    }
}
