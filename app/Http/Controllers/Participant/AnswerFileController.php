<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\PracticumSession;
use App\Models\PreliminaryTaskPeriod;
use App\Models\Question;
use App\Models\Submission;
use App\Models\SubmissionAnswer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class AnswerFileController extends Controller
{
    /**
     * Handle asynchronous file upload for answer.
     */
    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'image', 'mimes:png,jpg,jpeg,webp', 'max:10240'],
            'question_id' => ['required', 'integer', 'exists:questions,id'],
            'practicum_session_id' => ['nullable', 'integer', 'exists:practicum_sessions,id'],
            'preliminary_task_period_id' => ['nullable', 'integer', 'exists:preliminary_task_periods,id'],
        ], [
            'file.image' => 'Berkas harus berupa gambar.',
            'file.mimes' => 'Format gambar yang diperbolehkan hanya PNG, JPG, JPEG, dan WEBP.',
            'file.max' => 'Ukuran gambar maksimal adalah 10 MB.',
        ]);

        if (empty($validated['practicum_session_id']) && empty($validated['preliminary_task_period_id'])) {
            return response()->json([
                'message' => 'Sesi praktikum atau periode tugas pendahuluan harus disertakan.',
            ], 422);
        }

        $user = $request->user();
        $question = Question::findOrFail($validated['question_id']);

        if (! empty($validated['preliminary_task_period_id'])) {
            $period = PreliminaryTaskPeriod::findOrFail($validated['preliminary_task_period_id']);

            if (! $period->isOngoing()) {
                return response()->json([
                    'message' => 'Periode pengerjaan tugas pendahuluan sedang tidak aktif.',
                ], 403);
            }

            $alreadySubmitted = Submission::where('participant_id', $user->id)
                ->where('preliminary_task_period_id', $period->id)
                ->whereIn('status', ['submitted', 'graded'])
                ->exists();

            if ($alreadySubmitted) {
                return response()->json([
                    'message' => 'Jawaban telah dikumpulkan dan tidak dapat diubah.',
                ], 403);
            }

            $answer = Answer::firstOrNew([
                'participant_id' => $user->id,
                'question_id' => $question->id,
                'preliminary_task_period_id' => $period->id,
            ]);
        } else {
            $session = PracticumSession::findOrFail($validated['practicum_session_id']);

            if (! $session->isActive()) {
                return response()->json([
                    'message' => 'Sesi praktikum tidak sedang aktif.',
                ], 403);
            }

            $answer = Answer::firstOrNew([
                'participant_id' => $user->id,
                'question_id' => $question->id,
                'practicum_session_id' => $session->id,
            ]);
        }

        $uploadedFile = $request->file('file');
        $disk = config('filesystems.answers_disk', 'public');
        $path = $uploadedFile->store('answers/'.$user->id, $disk);

        $answer->status = 'saved';
        $answer->last_saved_at = now();
        $answer->save();

        $fileData = [
            'disk' => $disk,
            'path' => $path,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'mime_type' => $uploadedFile->getClientMimeType() ?: $uploadedFile->getMimeType(),
            'size_bytes' => $uploadedFile->getSize(),
            'url' => route('participant.answers.file', ['answer' => $answer->id]),
        ];

        $answer->content = json_encode($fileData);
        $answer->save();

        return response()->json([
            'success' => true,
            'answer_id' => $answer->id,
            'data' => $fileData,
        ]);
    }

    /**
     * Download or view uploaded answer file.
     */
    public function show(Request $request, Answer $answer): Response
    {
        $user = $request->user();

        if ($user->user_type === 'participant' && $answer->participant_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke berkas jawaban ini.');
        }

        $payload = json_decode($answer->content ?? '', true);
        if (! is_array($payload) || empty($payload['path'])) {
            abort(404, 'Berkas jawaban tidak ditemukan.');
        }

        $disk = $payload['disk'] ?? config('filesystems.answers_disk', 'public');
        $path = $payload['path'];

        if (! Storage::disk($disk)->exists($path)) {
            abort(404, 'Berkas fisik tidak ditemukan di penyimpanan.');
        }

        return Storage::disk($disk)->response($path, $payload['original_name'] ?? null);
    }

    /**
     * Download or view snapshot answer file from assistant/admin grading.
     */
    public function showSubmissionAnswer(Request $request, SubmissionAnswer $submissionAnswer): Response
    {
        $user = $request->user();

        if ($user->user_type === 'participant' && $submissionAnswer->submission?->participant_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses ke berkas snapshot jawaban ini.');
        }

        $payload = json_decode($submissionAnswer->answer_content_snapshot ?? '', true);
        if (! is_array($payload) || empty($payload['path'])) {
            abort(404, 'Berkas snapshot jawaban tidak ditemukan.');
        }

        $disk = $payload['disk'] ?? config('filesystems.answers_disk', 'public');
        $path = $payload['path'];

        if (! Storage::disk($disk)->exists($path)) {
            abort(404, 'Berkas fisik snapshot tidak ditemukan di penyimpanan.');
        }

        return Storage::disk($disk)->response($path, $payload['original_name'] ?? null);
    }
}
