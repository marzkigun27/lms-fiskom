<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Question;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Spatie\Permission\Models\Role;

class ProductionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (['assistant', 'participant'] as $role) {
            Role::findOrCreate($role, 'web');
        }

        $author = User::query()
            ->where('identity_number', 'BOT')
            ->where('user_type', 'assistant')
            ->where('status', 'active')
            ->first()
            ?? User::query()
                ->where('user_type', 'assistant')
                ->where('status', 'active')
                ->oldest('id')
                ->first();

        if (! $author) {
            throw new RuntimeException('ProductionSeeder requires an active assistant to author production questions.');
        }

        DB::transaction(function () use ($author): void {
            $semester = Semester::query()->updateOrCreate(
                [
                    'academic_year' => '2026/2027',
                    'term' => 'odd',
                ],
                [
                    'name' => 'Semester Ganjil 2026/2027',
                    'starts_at' => '2026-09-01 00:00:00',
                    'ends_at' => '2027-02-28 23:59:59',
                    'is_active' => true,
                ],
            );

            Semester::query()
                ->where('is_active', true)
                ->whereKeyNot($semester->id)
                ->update(['is_active' => false]);

            $module = Module::withTrashed()
                ->where('semester_id', $semester->id)
                ->where('code', 'M0')
                ->first();

            if ($module?->trashed()) {
                $module->restore();
            }

            $module ??= new Module;
            $module->fill([
                'semester_id' => $semester->id,
                'code' => 'M0',
                'title' => 'Modul 0: Simulasi / Running Modul',
                'description' => 'Modul simulasi untuk memvalidasi alur praktikum lengkap dari tugas pendahuluan, tugas awal, jurnal, hingga tugas akhir.',
                'order_number' => 1,
                'status' => 'published',
                'published_at' => '2026-09-01 00:00:00',
            ])->save();

            foreach ($this->moduleZeroQuestions() as $sessionType => $questions) {
                foreach ($questions as $index => $questionData) {
                    $question = Question::withTrashed()->firstOrNew([
                        'module_id' => $module->id,
                        'session_type' => $sessionType,
                        'order_number' => $index + 1,
                    ]);

                    if ($question->trashed()) {
                        $question->restore();
                    }

                    $question->fill([
                        ...$questionData,
                        'module_id' => $module->id,
                        'session_type' => $sessionType,
                        'order_number' => $index + 1,
                        'is_required' => true,
                        'status' => 'published',
                        'created_by' => $author->id,
                        'updated_by' => $author->id,
                    ])->save();
                }
            }
        });
    }

    /**
     * @return array<string, array<int, array{description: string, answer_type: string, programming_language: string|null}>>
     */
    private function moduleZeroQuestions(): array
    {
        return [
            'preliminary' => [
                [
                    'description' => 'Jelaskan alur praktikum pada LMS mulai dari Tugas Pendahuluan, Tugas Awal, Jurnal, hingga Tugas Akhir. Sebutkan tujuan setiap tahap secara ringkas.',
                    'answer_type' => 'text',
                    'programming_language' => null,
                ],
                [
                    'description' => 'Buat fungsi Python bernama `hitung_rata_rata` yang menerima sebuah list angka dan mengembalikan nilai rata-ratanya. Sertakan penanganan untuk list kosong.',
                    'answer_type' => 'code',
                    'programming_language' => 'python',
                ],
                [
                    'description' => 'Tuliskan hipotesis mengenai pengaruh besar langkah waktu terhadap ketelitian hasil simulasi numerik gerak lurus.',
                    'answer_type' => 'text',
                    'programming_language' => null,
                ],
            ],
            'initial_task' => [
                [
                    'description' => 'Jelaskan parameter awal yang harus ditentukan sebelum menjalankan simulasi gerak lurus berubah beraturan.',
                    'answer_type' => 'text',
                    'programming_language' => null,
                ],
                [
                    'description' => 'Buat program Python yang menghitung posisi dan kecepatan benda setiap 0,1 detik selama 5 detik untuk posisi awal 0 m, kecepatan awal 2 m/s, dan percepatan 1 m/s².',
                    'answer_type' => 'code',
                    'programming_language' => 'python',
                ],
                [
                    'description' => 'Prediksi bentuk grafik posisi terhadap waktu dan kecepatan terhadap waktu dari simulasi tersebut, lalu jelaskan alasan fisiknya.',
                    'answer_type' => 'text',
                    'programming_language' => null,
                ],
            ],
            'journal' => [
                [
                    'description' => 'Jalankan simulasi untuk beberapa nilai langkah waktu, lalu tuliskan kode yang menyimpan waktu, posisi, dan kecepatan ke dalam array NumPy.',
                    'answer_type' => 'code',
                    'programming_language' => 'python',
                ],
                [
                    'description' => 'Buat visualisasi posisi dan kecepatan terhadap waktu menggunakan Matplotlib. Berikan judul, label sumbu, legenda, dan grid yang sesuai.',
                    'answer_type' => 'code',
                    'programming_language' => 'python',
                ],
                [
                    'description' => 'Bandingkan hasil numerik dengan solusi analitik. Jelaskan sumber galat dan pengaruh perubahan langkah waktu berdasarkan data yang diperoleh.',
                    'answer_type' => 'text',
                    'programming_language' => null,
                ],
            ],
            'independent_task' => [
                [
                    'description' => 'Kembangkan simulasi agar menerima posisi awal, kecepatan awal, percepatan, durasi, dan langkah waktu sebagai input. Tampilkan hasil akhir serta grafik gerak.',
                    'answer_type' => 'code',
                    'programming_language' => 'python',
                ],
                [
                    'description' => 'Analisis dua skenario dengan parameter awal berbeda. Bandingkan perilaku geraknya dan simpulkan hubungan parameter terhadap hasil simulasi.',
                    'answer_type' => 'text',
                    'programming_language' => null,
                ],
                [
                    'description' => 'Unggah laporan ringkas dalam format PDF yang memuat tujuan, metode, kode utama, grafik hasil, analisis galat, dan kesimpulan simulasi.',
                    'answer_type' => 'file',
                    'programming_language' => null,
                ],
            ],
        ];
    }
}
