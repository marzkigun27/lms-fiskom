<?php

use App\Http\Controllers\Assistant\GlobalControlController;
use App\Http\Controllers\Assistant\GradingController;
use App\Http\Controllers\Assistant\ParticipantManagementController;
use App\Http\Controllers\Assistant\PracticumController;
use App\Http\Controllers\Assistant\QuestionManagementController;
use App\Http\Controllers\Assistant\WeeklyScheduleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Participant\AnswerFileController;
use App\Http\Controllers\Participant\FeedbackController;
use App\Http\Controllers\Participant\GradesController;
use App\Http\Controllers\Participant\PreLabController;
use App\Http\Controllers\Participant\ProfileController;
use App\Http\Controllers\Participant\VotingController;
use App\Http\Controllers\Participant\WorkspaceController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureActiveAssistant;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', fn () => redirect()->route('login.praktikan'))->name('login');
    Route::get('/register', fn () => redirect()->route('register.praktikan'))->name('register');

    Route::get('/login/praktikan', function () {
        return inertia('welcome', [
            'showLoginModal' => true,
            'defaultAuthMode' => 'login',
            'defaultRole' => 'praktikan',
            'status' => session('status'),
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
        ]);
    })->name('login.praktikan');

    Route::get('/login/asisten', function () {
        return inertia('welcome', [
            'showLoginModal' => true,
            'defaultAuthMode' => 'login',
            'defaultRole' => 'asisten',
            'status' => session('status'),
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
        ]);
    })->name('login.asisten');

    Route::get('/register/praktikan', function () {
        return inertia('welcome', [
            'showLoginModal' => true,
            'defaultAuthMode' => 'register',
            'defaultRole' => 'praktikan',
        ]);
    })->name('register.praktikan');

    Route::get('/register/asisten', function () {
        return inertia('welcome', [
            'showLoginModal' => true,
            'defaultAuthMode' => 'register',
            'defaultRole' => 'asisten',
        ]);
    })->name('register.asisten');
});

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function (): void {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
    });

Route::middleware(['auth'])->group(function (): void {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');

    Route::prefix('praktikan')->name('participant.')->middleware('role:participant')->group(function (): void {
        Route::get('/', [App\Http\Controllers\Participant\DashboardController::class, 'index'])->name('dashboard');
        Route::get('praktikum', [WorkspaceController::class, 'index'])->name('workspace');
        Route::get('praktikum/{session}', [WorkspaceController::class, 'show'])->name('workspace.show');
        Route::post('praktikum/{session}/questions/{question}', [WorkspaceController::class, 'submit'])->name('workspace.submit');
        Route::get('nilai', [GradesController::class, 'index'])->name('grades');
        Route::get('tugas-pendahuluan', [PreLabController::class, 'index'])->name('prelab');
        Route::get('tugas-pendahuluan/{module}', [PreLabController::class, 'show'])->name('prelab.show');
        Route::post('tugas-pendahuluan/{module}/save-draft', [PreLabController::class, 'saveDraft'])->name('prelab.save_draft');
        Route::post('tugas-pendahuluan/{module}/submit', [PreLabController::class, 'submit'])->name('prelab.submit');
        Route::get('feedback', [FeedbackController::class, 'index'])->name('feedback');
        Route::post('feedback', [FeedbackController::class, 'store'])->name('feedback.store');
        Route::post('jawaban/upload-file', [AnswerFileController::class, 'upload'])->name('answers.upload');
        Route::get('voting', [VotingController::class, 'index'])->name('voting');
        Route::post('voting', [VotingController::class, 'submit'])->name('voting.submit');
        Route::get('profile', [ProfileController::class, 'index'])->name('profile');
    });

    Route::get('praktikan/jawaban/{answer}/file', [AnswerFileController::class, 'show'])->name('participant.answers.file');

    Route::prefix('asisten')->name('assistant.')->middleware('role:assistant')->group(function (): void {
        Route::get('/', [App\Http\Controllers\Assistant\DashboardController::class, 'index'])->name('dashboard');
        Route::get('global-control', [GlobalControlController::class, 'index'])->name('global_control.index');
        Route::post('global-control/prelab', [GlobalControlController::class, 'updatePrelabSchedule'])->name('global_control.prelab.update');
        Route::post('global-control/prelab/{period}/toggle', [GlobalControlController::class, 'togglePrelabStatus'])->name('global_control.prelab.toggle');
        Route::post('global-control/registration', [GlobalControlController::class, 'updateRegistration'])->name('global_control.registration.update');
        Route::post('global-control/voting/period', [GlobalControlController::class, 'updateVotingPeriod'])->name('global_control.voting.period.update');
        Route::post('global-control/voting/categories', [GlobalControlController::class, 'storeVotingCategory'])->name('global_control.voting.categories.store');
        Route::put('global-control/voting/categories/{category}', [GlobalControlController::class, 'updateVotingCategory'])->name('global_control.voting.categories.update');
        Route::delete('global-control/voting/categories/{category}', [GlobalControlController::class, 'destroyVotingCategory'])->name('global_control.voting.categories.destroy');
        Route::delete('jadwal/{schedule}', [WeeklyScheduleController::class, 'destroy'])->middleware(EnsureActiveAssistant::class)->name('schedule.destroy');
        Route::put('jadwal/{schedule}', [WeeklyScheduleController::class, 'update'])->middleware(EnsureActiveAssistant::class)->name('schedule.update');
        Route::post('jadwal', [WeeklyScheduleController::class, 'store'])->middleware(EnsureActiveAssistant::class)->name('schedule.store');
        Route::patch('jadwal/{schedule}/groups', [WeeklyScheduleController::class, 'updateGroupCodes'])->middleware(EnsureActiveAssistant::class)->name('schedule.groups.update');
        Route::get('jadwal', [WeeklyScheduleController::class, 'index'])->middleware(EnsureActiveAssistant::class)->name('schedule.index');
        Route::post('praktikum/start', [PracticumController::class, 'startSession'])->name('praktikum.start_session');
        Route::patch('praktikum/session/{session}/phase', [PracticumController::class, 'updateSessionPhase'])->name('praktikum.update_phase');
        Route::post('praktikum/session/{session}/end', [PracticumController::class, 'endSession'])->name('praktikum.end_session');
        Route::resource('praktikum', PracticumController::class)->except(['create', 'show', 'edit']);
        Route::get('nilai', [GradingController::class, 'index'])->name('grading.index');
        Route::post('nilai/{submission}', [GradingController::class, 'store'])->name('grading.store');
        Route::get('penilaian/submission-answer/{submissionAnswer}/file', [AnswerFileController::class, 'showSubmissionAnswer'])->name('grading.submission_file');
        Route::post('soal/modules', [QuestionManagementController::class, 'moduleStore'])->name('soal.modules.store');
        Route::put('soal/modules/{module}', [QuestionManagementController::class, 'moduleUpdate'])->name('soal.modules.update');
        Route::delete('soal/modules/{module}', [QuestionManagementController::class, 'moduleDestroy'])->name('soal.modules.destroy');
        Route::patch('soal/batch', [QuestionManagementController::class, 'batchUpdate'])->name('questions.batch');
        Route::resource('soal', QuestionManagementController::class)->except(['create', 'show', 'edit']);
        Route::post('peserta/bulk', [ParticipantManagementController::class, 'bulkStore'])->name('peserta.bulk');
        Route::get('peserta/template', [ParticipantManagementController::class, 'downloadTemplate'])->name('peserta.template');
        Route::resource('peserta', ParticipantManagementController::class)
            ->parameters(['peserta' => 'peserta'])
            ->except(['create', 'show', 'edit']);
        Route::get('feedback', [App\Http\Controllers\Assistant\FeedbackController::class, 'index'])->name('feedback.index');
        Route::patch('feedback/{feedback}', [App\Http\Controllers\Assistant\FeedbackController::class, 'update'])->name('feedback.update');
        Route::get('voting', [App\Http\Controllers\Assistant\VotingController::class, 'index'])->name('voting.index');
        Route::get('profile', [App\Http\Controllers\Assistant\ProfileController::class, 'index'])->name('profile');
    });

});

if (app()->environment(['local', 'testing'])) {
    Route::post('/test-broadcast', function (): JsonResponse {
        Broadcast::on('test-channel')
            ->as('TestEvent')
            ->with(['time' => now()->toDateTimeString(), 'message' => 'Hello from Reverb!'])
            ->sendNow();

        return response()->json(['status' => 'Event broadcasted!']);
    })->name('test.broadcast');
}

require __DIR__.'/settings.php';
