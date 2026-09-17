<?php

namespace Database\Seeders;

use App\Models\Answer;
use App\Models\AssistantAssignment;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Module;
use App\Models\ParticipantEnrollment;
use App\Models\PracticumClass;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\Question;
use App\Models\Semester;
use App\Models\Submission;
use App\Models\SubmissionAnswer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['assistant', 'participant'] as $role) {
            Role::findOrCreate($role, 'web');
        }

        $assistantLead = $this->user('admin@physpracticum.test', 'Assistant Lead', 'AST-002', 'assistant');
        $assistant = $this->user('assistant@physpracticum.test', 'Assistant User', 'AST-001', 'assistant');
        $participant1 = $this->user('participant1@physpracticum.test', 'Elena Carter', 'PAR-001');
        $participant2 = $this->user('participant2@physpracticum.test', 'James Lin', 'PAR-002');

        $semester = Semester::firstOrCreate(
            ['academic_year' => '2026/2027', 'term' => 'odd'],
            ['name' => 'Semester Ganjil 2026/2027', 'starts_at' => now()->startOfMonth(), 'ends_at' => now()->addMonths(6), 'is_active' => true]
        );
        $class = PracticumClass::firstOrCreate(
            ['semester_id' => $semester->id, 'code' => 'PHY-101'],
            ['name' => 'Physics 101', 'status' => 'active']
        );
        $group = Group::firstOrCreate(
            ['class_id' => $class->id, 'code' => 'A'],
            ['name' => 'Section A', 'status' => 'active']
        );

        foreach ([$participant1, $participant2] as $participant) {
            ParticipantEnrollment::firstOrCreate(
                ['semester_id' => $semester->id, 'participant_id' => $participant->id],
                ['class_id' => $class->id, 'group_id' => $group->id, 'status' => 'active', 'enrolled_at' => now()]
            );
        }
        AssistantAssignment::firstOrCreate(
            ['semester_id' => $semester->id, 'assistant_id' => $assistant->id, 'class_id' => $class->id, 'group_id' => $group->id, 'assignment_type' => 'mentor'],
            ['status' => 'active']
        );

        $module = Module::firstOrCreate(
            ['semester_id' => $semester->id, 'code' => 'MOD-001'],
            ['title' => 'Kinematics Foundations', 'description' => 'Introduction to one-dimensional and two-dimensional motion.', 'order_number' => 1, 'status' => 'published', 'published_at' => now()]
        );
        $questionDefinitions = [
            'preliminary' => [
                ['description' => 'Jelaskan perbedaan posisi, jarak, dan perpindahan.', 'answer_type' => 'text'],
                ['description' => 'Interpretasikan grafik posisi terhadap waktu pada kasus yang diberikan.', 'answer_type' => 'text'],
                ['description' => 'Turunkan persamaan gerak untuk percepatan konstan.', 'answer_type' => 'text'],
                ['description' => 'Jelaskan komponen horizontal dan vertikal pada gerak parabola.', 'answer_type' => 'text'],
                ['description' => 'Tuliskan tujuan dan hipotesis eksperimen kinematika.', 'answer_type' => 'text'],
            ],
            'initial_task' => [
                ['description' => 'Implementasikan metode Euler untuk menghitung lintasan benda.', 'answer_type' => 'code', 'programming_language' => 'python'],
                ['description' => 'Bandingkan hasil numerik dengan solusi analitik dan jelaskan galatnya.', 'answer_type' => 'text'],
                ['description' => 'Buat visualisasi lintasan berdasarkan data eksperimen.', 'answer_type' => 'code', 'programming_language' => 'python'],
            ],
            'journal' => [
                ['description' => 'Catat hasil observasi dan perubahan yang terjadi selama eksperimen.', 'answer_type' => 'text'],
                ['description' => 'Jelaskan hubungan hasil eksperimen dengan teori yang dipelajari.', 'answer_type' => 'text'],
            ],
            'independent_task' => [
                ['description' => 'Analisis kasus kinematika yang diberikan dan simpulkan hasilnya.', 'answer_type' => 'text'],
            ],
        ];
        $questions = [];
        foreach ($questionDefinitions as $sessionType => $definitions) {
            foreach ($definitions as $order => $definition) {
                $questions[$sessionType][] = Question::firstOrCreate(
                    ['module_id' => $module->id, 'session_type' => $sessionType, 'order_number' => $order + 1],
                    [
                        'description' => $definition['description'],
                        'answer_type' => $definition['answer_type'],
                        'programming_language' => $definition['programming_language'] ?? null,
                        'is_required' => true,
                        'status' => 'published',
                        'created_by' => $assistantLead->id,
                        'updated_by' => $assistantLead->id,
                    ]
                );
            }
        }
        $question = $questions['initial_task'][0];
        $schedule = PracticumSchedule::firstOrCreate(
            ['module_id' => $module->id, 'class_id' => $class->id],
            ['starts_at' => now(), 'ends_at' => now()->addHours(2), 'room' => 'Lab 1', 'status' => 'scheduled']
        );
        $session = PracticumSession::firstOrCreate(
            ['practicum_schedule_id' => $schedule->id, 'session_type' => 'initial_task'],
            ['order_number' => 1, 'state' => 'active', 'planned_duration_minutes' => 120, 'opened_at' => now(), 'opened_by' => $assistant->id]
        );

        $answer = Answer::firstOrCreate(
            ['question_id' => $question->id, 'participant_id' => $participant1->id, 'practicum_session_id' => $session->id],
            ['content' => "print('19.6')", 'status' => 'submitted', 'last_saved_at' => now(), 'submitted_at' => now()]
        );
        $submission = Submission::firstOrCreate(
            ['participant_id' => $participant1->id, 'practicum_session_id' => $session->id],
            ['status' => 'submitted', 'submitted_at' => now(), 'submitted_by' => $participant1->id, 'attempt_number' => 1]
        );
        SubmissionAnswer::firstOrCreate(
            ['submission_id' => $submission->id, 'question_id' => $question->id],
            ['answer_id' => $answer->id, 'answer_content_snapshot' => $answer->content, 'question_snapshot' => $question->only(['description', 'answer_type', 'programming_language']), 'submitted_at' => now()]
        );
        Grade::firstOrCreate(
            ['submission_id' => $submission->id],
            ['participant_id' => $participant1->id, 'module_id' => $module->id, 'session_type' => 'initial_task', 'score' => 100, 'max_score' => 100, 'feedback' => 'Good work.', 'status' => 'published', 'graded_by' => $assistant->id, 'graded_at' => now(), 'published_at' => now()]
        );
    }

    private function user(string $email, string $name, string $identityNumber, string $type = 'participant'): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'identity_number' => $identityNumber, 'password' => Hash::make('password'), 'user_type' => $type, 'status' => 'active', 'email_verified_at' => now()]
        );
        $user->forceFill(['user_type' => $type, 'status' => 'active'])->save();
        $user->syncRoles([$type]);

        return $user;
    }
}
