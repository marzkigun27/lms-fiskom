<?php

use App\Models\Answer;
use App\Models\Grade;
use App\Models\Module;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\Question;
use App\Models\Semester;
use App\Models\Submission;
use App\Models\User;
use App\Models\WeeklySchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function createParticipantGradesContext(): array
{
    $semester = Semester::create([
        'name' => 'Ganjil 2026/2027',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => '2026-08-01 00:00:00',
        'ends_at' => '2026-12-31 23:59:59',
        'is_active' => true,
    ]);

    $assistant = User::factory()->assistant()->create(['name' => 'Kak Budi Mentor']);
    $participantA = User::factory()->participant()->create(['name' => 'Praktikan A']);
    $participantB = User::factory()->participant()->create(['name' => 'Praktikan B']);

    $module = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-01',
        'title' => 'Pengantar Sinyal Komputasi',
        'description' => 'Eksperimen sinyal',
        'order_number' => 1,
        'status' => 'published',
        'published_at' => now(),
    ]);

    $question = Question::create([
        'module_id' => $module->id,
        'session_type' => 'preliminary',
        'description' => 'Jelaskan prinsip transformasi Fourier.',
        'answer_type' => 'text',
        'order_number' => 1,
        'is_required' => true,
        'status' => 'published',
        'created_by' => $assistant->id,
        'updated_by' => $assistant->id,
    ]);

    Answer::create([
        'question_id' => $question->id,
        'participant_id' => $participantA->id,
        'content' => 'Transformasi Fourier memetakan sinyal dari domain waktu ke domain frekuensi.',
    ]);

    $weeklySchedule = WeeklySchedule::create([
        'semester_id' => $semester->id,
        'day' => 'Senin',
        'shift' => 'Shift 1 (06:30 - 09:30)',
    ]);

    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $weeklySchedule->id,
        'module_id' => $module->id,
        'started_by' => $assistant->id,
        'status' => 'ongoing',
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
    ]);

    $session = PracticumSession::create([
        'practicum_schedule_id' => $schedule->id,
        'session_type' => 'independent_task',
        'order_number' => 3,
        'state' => 'active',
        'opened_at' => now(),
        'planned_duration_minutes' => 60,
    ]);

    $submission = Submission::create([
        'participant_id' => $participantA->id,
        'practicum_session_id' => $session->id,
        'status' => 'submitted',
        'submitted_at' => now(),
        'submitted_by' => $participantA->id,
        'attempt_number' => 1,
    ]);

    $grade = Grade::create([
        'submission_id' => $submission->id,
        'participant_id' => $participantA->id,
        'module_id' => $module->id,
        'session_type' => 'independent_task',
        'score' => 88.0,
        'max_score' => 100,
        'component_scores' => [
            'tp' => 85,
            'ta' => 90,
            'd1' => 88,
            'd2' => 88,
            'd3' => 90,
            'd4' => 85,
            'i1' => 90,
            'i2' => 88,
        ],
        'feedback' => 'Analisis data fisis Anda sangat rapi dan komprehensif.',
        'status' => 'published',
        'graded_by' => $assistant->id,
        'graded_at' => now(),
        'published_at' => now(),
    ]);

    return compact('semester', 'assistant', 'participantA', 'participantB', 'module', 'question', 'grade');
}

it('displays authentic grades, assistant mentor name, and assistant feedback for authenticated participant', function () {
    $context = createParticipantGradesContext();

    $response = $this->actingAs($context['participantA'])->get(route('participant.grades'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Participant/Grades')
        ->has('modules', 1)
        ->where('modules.0.id', $context['module']->id)
        ->where('modules.0.average_score', 88)
        ->where('modules.0.paramScores.TP', 85)
        ->where('modules.0.paramScores.TA', 90)
        ->where('modules.0.assistant_name', 'Kak Budi Mentor')
        ->where('modules.0.assistant_feedback', 'Analisis data fisis Anda sangat rapi dan komprehensif.')
        ->has('modules.0.sessions', 1)
        ->where('modules.0.sessions.0.questions.0.answer', 'Transformasi Fourier memetakan sinyal dari domain waktu ke domain frekuensi.')
        ->where('totalAverage', 88)
        ->where('letterGrade', 'A')
    );
});

it('ensures participant only sees their own grades and not other participants', function () {
    $context = createParticipantGradesContext();

    // Participant B has no grades submitted or given
    $response = $this->actingAs($context['participantB'])->get(route('participant.grades'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Participant/Grades')
        ->has('modules', 1)
        ->where('modules.0.average_score', 0)
        ->where('modules.0.assistant_feedback', null)
        ->where('totalAverage', 0)
    );
});

it('correctly handles empty state for assistant feedback when no feedback was given', function () {
    $context = createParticipantGradesContext();

    // Update grade to have null feedback
    $context['grade']->update(['feedback' => null]);

    $response = $this->actingAs($context['participantA'])->get(route('participant.grades'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Participant/Grades')
        ->where('modules.0.assistant_feedback', null)
    );
});

it('does not display questions for upcoming module when participant has not completed any session', function () {
    $context = createParticipantGradesContext();

    // Create an upcoming module with questions
    $upcomingModule = Module::create([
        'semester_id' => $context['semester']->id,
        'code' => 'MOD-02',
        'title' => 'Modul 2 Akan Datang',
        'order_number' => 2,
        'status' => 'published',
    ]);

    Question::create([
        'module_id' => $upcomingModule->id,
        'session_type' => 'initial_task',
        'description' => 'Soal rahasia tugas awal modul 2.',
        'answer_type' => 'text',
        'order_number' => 1,
        'is_required' => true,
        'status' => 'published',
        'created_by' => $context['assistant']->id,
        'updated_by' => $context['assistant']->id,
    ]);

    // Participant A visits grades page
    $response = $this->actingAs($context['participantA'])->get(route('participant.grades'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Participant/Grades')
        ->has('modules', 2)
        // Module 1 is completed so sessions exist
        ->where('modules.0.id', $context['module']->id)
        ->has('modules.0.sessions', 1)
        // Module 2 is upcoming/uncompleted so sessions are empty and questions are NOT revealed!
        ->where('modules.1.id', $upcomingModule->id)
        ->where('modules.1.sessions', [])
    );
});

it('displays completed preliminary task but hides upcoming in-lab sessions until completed', function () {
    $context = createParticipantGradesContext();

    $module2 = Module::create([
        'semester_id' => $context['semester']->id,
        'code' => 'MOD-03',
        'title' => 'Modul 3 Parsial',
        'order_number' => 3,
        'status' => 'published',
    ]);

    $tpQuestion = Question::create([
        'module_id' => $module2->id,
        'session_type' => 'preliminary',
        'description' => 'Soal TP Modul 3.',
        'answer_type' => 'text',
        'order_number' => 1,
        'is_required' => true,
        'status' => 'published',
        'created_by' => $context['assistant']->id,
        'updated_by' => $context['assistant']->id,
    ]);

    $taQuestion = Question::create([
        'module_id' => $module2->id,
        'session_type' => 'initial_task',
        'description' => 'Soal TA Modul 3 yang belum dimulai.',
        'answer_type' => 'text',
        'order_number' => 1,
        'is_required' => true,
        'status' => 'published',
        'created_by' => $context['assistant']->id,
        'updated_by' => $context['assistant']->id,
    ]);

    // Participant A has submitted TP answer
    Answer::create([
        'question_id' => $tpQuestion->id,
        'participant_id' => $context['participantA']->id,
        'content' => 'Jawaban TP saya.',
        'status' => 'submitted',
    ]);

    $response = $this->actingAs($context['participantA'])->get(route('participant.grades'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Participant/Grades')
        ->has('modules', 2)
        ->where('modules.1.id', $module2->id)
        // Should only have 1 session (TP) and NOT TA!
        ->has('modules.1.sessions', 1)
        ->where('modules.1.sessions.0.name', 'Tugas Pendahuluan (TP)')
        ->where('modules.1.sessions.0.questions.0.question', 'Soal 1: Soal TP Modul 3.')
        ->where('modules.1.sessions.0.questions.0.answer', 'Jawaban TP saya.')
    );
});
