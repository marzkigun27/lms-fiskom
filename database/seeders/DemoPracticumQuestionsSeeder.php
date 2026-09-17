<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Question;
use Illuminate\Database\Seeder;

class DemoPracticumQuestionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Temukan modul pertama, jika tidak ada, buat dummy
        $module = Module::first();
        if (! $module) {
            $module = Module::create([
                'title' => 'Modul 3: Gesekan',
                'description' => 'Mempelajari konsep gaya gesekan',
                'order_number' => 1,
                'status' => 'published',
                'code' => 'M3',
            ]);
        }

        // Hapus soal lama untuk modul ini agar tidak menumpuk saat di-seed ulang
        Question::where('module_id', $module->id)->delete();

        $questions = [
            // Tugas Awal (Initial Task)
            [
                'module_id' => $module->id,
                'session_type' => 'initial_task',
                'description' => 'Jelaskan secara singkat apa yang dimaksud dengan koefisien gesekan statis! Gunakan bahasa Anda sendiri. Tidak perlu terlalu panjang.',
                'answer_type' => 'text',
                'programming_language' => null,
                'is_required' => true,
                'order_number' => 1,
            ],
            [
                'module_id' => $module->id,
                'session_type' => 'initial_task',
                'description' => 'Buatlah sebuah fungsi dalam Python untuk menghitung gaya gesek statis maksimum jika diketahui mu_s dan massa m. Asumsikan gravitasi g = 9.8 m/s^2. Pastikan nama fungsi adalah `hitung_gesekan_statis`.',
                'answer_type' => 'code',
                'programming_language' => 'python',
                'is_required' => true,
                'order_number' => 2,
            ],
            [
                'module_id' => $module->id,
                'session_type' => 'initial_task',
                'description' => 'Apa perbedaan utama antara gesekan statis dan gesekan kinetis?',
                'answer_type' => 'text',
                'programming_language' => null,
                'is_required' => true,
                'order_number' => 3,
            ],

            // Jurnal Praktikum (Journal)
            [
                'module_id' => $module->id,
                'session_type' => 'journal',
                'description' => 'Masukkan data eksperimen (massa, gaya tarik, delta_x) ke dalam bentuk array/list Python! Gunakan data yang diperoleh dari alat ukur (pegas & beban). Gunakan library `numpy` jika diperlukan.',
                'answer_type' => 'code',
                'programming_language' => 'python',
                'is_required' => true,
                'order_number' => 1,
            ],
            [
                'module_id' => $module->id,
                'session_type' => 'journal',
                'description' => 'Lakukan fitting regresi linear pada data yang Anda peroleh untuk mencari konstanta pegas. Anda bisa menggunakan `scipy.stats.linregress` atau `numpy.polyfit`. Tampilkan nilai gradien dan intercept.',
                'answer_type' => 'code',
                'programming_language' => 'python',
                'is_required' => true,
                'order_number' => 2,
            ],
            [
                'module_id' => $module->id,
                'session_type' => 'journal',
                'description' => 'Berdasarkan hasil regresi, apakah data Anda sesuai dengan Hukum Hooke? Jelaskan!',
                'answer_type' => 'text',
                'programming_language' => null,
                'is_required' => true,
                'order_number' => 3,
            ],

            // Tugas Akhir (Independent Task)
            [
                'module_id' => $module->id,
                'session_type' => 'independent_task',
                'description' => 'Buatlah skrip visualisasi data (Plot) menggunakan Matplotlib untuk menampilkan grafik gaya (F) terhadap pertambahan panjang (delta_x) dengan garis regresi. Grafik harus mencantumkan label sumbu (X dan Y) dan judul grafik. Pastikan plot disave dengan nama `plot_hooke.png` atau ditampikan dengan `plt.show()`.',
                'answer_type' => 'code',
                'programming_language' => 'python',
                'is_required' => true,
                'order_number' => 1,
            ],
        ];

        foreach ($questions as $q) {
            Question::create($q);
        }
    }
}
