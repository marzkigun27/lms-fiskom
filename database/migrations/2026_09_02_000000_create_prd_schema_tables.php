<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 9.3 Struktur semester, kelas, dan kelompok
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('academic_year', 20);
            $table->enum('term', ['odd', 'even', 'short']);
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name', 100);
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['semester_id', 'code']);
        });

        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained()->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name', 100);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['class_id', 'code']);
        });

        Schema::create('participant_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['active', 'inactive', 'withdrawn'])->default('active');
            $table->timestamp('enrolled_at');
            $table->timestamps();

            $table->unique(['semester_id', 'participant_id']);
            $table->index(['class_id', 'group_id', 'status']);
        });

        Schema::create('assistant_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assistant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('assignment_type', ['teacher', 'mentor', 'observer'])->default('mentor');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->unique(['semester_id', 'assistant_id', 'class_id', 'group_id', 'assignment_type'], 'ast_assign_unique');
        });

        // 9.4 Modul, jadwal, dan sesi praktikum
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->integer('order_number');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['semester_id', 'code']);
            $table->unique(['semester_id', 'order_number']);
        });

        Schema::create('practicum_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained()->cascadeOnDelete();
            $table->string('room', 100)->nullable();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
            $table->foreignId('started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('actual_started_at')->nullable();
            $table->timestamp('actual_completed_at')->nullable();
            $table->timestamps();

            $table->unique(['module_id', 'class_id']);
        });

        Schema::create('practicum_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practicum_schedule_id')->constrained()->cascadeOnDelete();
            $table->enum('session_type', ['initial_task', 'journal', 'independent_task', 'feedback']);
            $table->integer('order_number');
            $table->enum('state', ['scheduled', 'waiting', 'active', 'closed', 'completed'])->default('scheduled');
            $table->integer('planned_duration_minutes')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('opened_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['practicum_schedule_id', 'session_type']);
        });

        Schema::create('preliminary_task_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('opens_at');
            $table->timestamp('deadline_at');
            $table->enum('state', ['scheduled', 'active', 'closed'])->default('scheduled');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->constrained('users');
            $table->timestamps();

            $table->unique(['module_id', 'class_id']);
        });

        Schema::create('session_state_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practicum_session_id')->constrained()->cascadeOnDelete();
            $table->string('from_state');
            $table->string('to_state');
            $table->foreignId('changed_by')->constrained('users');
            $table->text('reason')->nullable();
            $table->timestamp('changed_at');
            // created_at / updated_at can be omitted or kept based on framework, using changed_at mostly.
            $table->timestamps();
        });

        // 9.5 Pengelolaan soal dan resource
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->enum('session_type', ['preliminary', 'initial_task', 'journal', 'independent_task']);
            $table->string('title', 255)->nullable();
            $table->longText('description');
            $table->longText('instructions')->nullable();
            $table->enum('answer_type', ['text', 'code']);
            $table->string('programming_language', 50)->nullable();
            $table->decimal('weight', 8, 2)->default(0);
            $table->integer('order_number');
            $table->boolean('is_required')->default(true);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['module_id', 'session_type', 'order_number']);
        });

        Schema::create('question_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->string('display_name', 255);
            $table->string('storage_path', 500);
            $table->string('mime_type', 100);
            $table->bigInteger('size_bytes');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();
        });

        // 9.6 Draft jawaban dan submission
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('practicum_session_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('preliminary_task_period_id')->nullable()->constrained()->cascadeOnDelete();
            $table->longText('content')->nullable();
            $table->enum('status', ['not_started', 'in_progress', 'saved', 'submitted'])->default('not_started');
            $table->timestamp('last_saved_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();
        });

        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('practicum_session_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('preliminary_task_period_id')->nullable()->constrained()->cascadeOnDelete();
            $table->enum('status', ['submitted', 'reopened', 'graded'])->default('submitted');
            $table->timestamp('submitted_at');
            $table->foreignId('submitted_by')->constrained('users');
            $table->timestamp('reopened_at')->nullable();
            $table->foreignId('reopened_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reopen_reason')->nullable();
            $table->integer('attempt_number')->default(1);
            $table->timestamps();
        });

        Schema::create('submission_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('answer_id')->nullable()->constrained()->nullOnDelete();
            $table->longText('answer_content_snapshot')->nullable();
            $table->json('question_snapshot');
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->unique(['submission_id', 'question_id']);
        });

        // 9.7 Kehadiran dan realtime participant state
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practicum_schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['present', 'late', 'absent', 'excused'])->default('absent');
            $table->timestamp('checked_in_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['practicum_schedule_id', 'participant_id']);
        });

        Schema::create('participant_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('practicum_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('connection_status', ['online', 'offline'])->default('offline');
            $table->enum('activity_state', ['waiting', 'viewing', 'answering', 'saved', 'submitted', 'completed'])->default('waiting');
            $table->timestamp('last_seen_at');
            $table->timestamps();

            $table->unique(['participant_id', 'practicum_session_id']);
        });

        // 9.8 Penilaian dan audit nilai
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->enum('session_type', ['preliminary', 'initial_task', 'journal', 'independent_task']);
            $table->decimal('score', 8, 2)->default(0);
            $table->decimal('max_score', 8, 2)->default(100);
            $table->text('feedback')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->foreignId('graded_by')->constrained('users');
            $table->timestamp('graded_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();

            $table->unique(['submission_id']);
        });

        Schema::create('grade_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_id')->constrained()->cascadeOnDelete();
            $table->foreignId('submission_answer_id')->constrained()->cascadeOnDelete();
            $table->decimal('score', 8, 2)->default(0);
            $table->decimal('max_score', 8, 2)->default(100);
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->unique(['grade_id', 'submission_answer_id']);
        });

        Schema::create('grade_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_id')->constrained()->cascadeOnDelete();
            $table->decimal('old_score', 8, 2)->nullable();
            $table->decimal('new_score', 8, 2)->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->json('change_snapshot')->nullable();
            $table->foreignId('changed_by')->constrained('users');
            $table->text('reason')->nullable();
            $table->timestamp('changed_at');
            $table->timestamps();
        });

        Schema::create('grading_weights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->enum('session_type', ['preliminary', 'initial_task', 'journal', 'independent_task']);
            $table->decimal('weight_percent', 5, 2)->default(0);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->constrained('users');
            $table->timestamps();

            $table->unique(['module_id', 'session_type']);
        });

        // 9.9 Announcement
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->longText('content');
            $table->foreignId('created_by')->constrained('users');
            $table->enum('audience_type', ['all', 'role', 'class', 'group', 'schedule'])->default('all');
            $table->unsignedBigInteger('audience_reference_id')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->enum('priority', ['normal', 'important', 'urgent'])->default('normal');
            $table->timestamps();
        });

        // 9.10 Feedback dan percakapan
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->enum('feedback_type', ['general', 'personal']);
            $table->foreignId('target_assistant_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('module_id')->nullable()->constrained()->nullOnDelete();
            $table->text('content');
            $table->boolean('is_anonymous_to_target')->default(false);
            $table->enum('status', ['submitted', 'reviewed', 'archived'])->default('submitted');
            $table->timestamps();
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('assigned_assistant_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('module_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject', 255);
            $table->enum('status', ['waiting', 'answered', 'closed'])->default('waiting');
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('participant_role', ['requester', 'responder', 'observer']);
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();

            $table->unique(['conversation_id', 'user_id']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users');
            $table->text('content');
            $table->timestamp('sent_at');
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
        });

        // 9.11 Voting asisten
        Schema::create('vote_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->string('title', 255);
            $table->timestamp('opens_at');
            $table->timestamp('closes_at');
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('vote_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vote_period_id')->constrained()->cascadeOnDelete();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->integer('order_number');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['vote_period_id', 'name']);
        });

        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vote_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vote_category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('voter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assistant_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps(); // includes created_at and updated_at

            $table->unique(['vote_period_id', 'vote_category_id', 'voter_id']);
        });

        // 9.12 System state dan audit umum
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 150)->unique();
            $table->text('value')->nullable(); // JSON or text
            $table->enum('value_type', ['string', 'number', 'boolean', 'json', 'datetime']);
            $table->foreignId('updated_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 150);
            $table->string('auditable_type', 150);
            $table->string('auditable_id');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps(); // covers created_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('votes');
        Schema::dropIfExists('vote_categories');
        Schema::dropIfExists('vote_periods');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('feedback');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('grading_weights');
        Schema::dropIfExists('grade_histories');
        Schema::dropIfExists('grade_items');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('participant_states');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('submission_answers');
        Schema::dropIfExists('submissions');
        Schema::dropIfExists('answers');
        Schema::dropIfExists('question_resources');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('session_state_histories');
        Schema::dropIfExists('preliminary_task_periods');
        Schema::dropIfExists('practicum_sessions');
        Schema::dropIfExists('practicum_schedules');
        Schema::dropIfExists('modules');
        Schema::dropIfExists('assistant_assignments');
        Schema::dropIfExists('participant_enrollments');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('semesters');
    }
};
