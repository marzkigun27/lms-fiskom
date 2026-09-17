<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\AssistantModuleParticipant;
use App\Models\Feedback;
use App\Models\Module;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackController extends Controller
{
    public function index(Request $request): Response
    {
        $modules = Module::select('id', 'code', 'title')->orderBy('order_number')->get();
        $assistants = User::query()
            ->where(function ($query) {
                $query->where('user_type', 'assistant')
                    ->orWhereHas('roles', fn ($q) => $q->where('name', 'assistant'));
            })
            ->where('status', 'active')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Participant/Feedback', [
            'modules' => $modules,
            'assistants' => $assistants,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'module_id' => 'nullable|exists:modules,id',
            'feedback_type' => 'nullable|in:general,personal',
            'target_assistant_id' => 'nullable|required_if:feedback_type,personal|exists:users,id',
            'rating' => 'nullable|required_with:target_assistant_id|integer|min:1|max:5',
            'content' => 'required|string|min:5',
            'is_anonymous_to_target' => 'nullable|boolean',
        ]);

        $validated['feedback_type'] = $validated['feedback_type'] ?? (! empty($validated['target_assistant_id']) ? 'personal' : 'general');
        $validated['sender_id'] = $request->user()->id;
        $validated['status'] = 'submitted';
        $validated['is_anonymous_to_target'] = $request->boolean('is_anonymous_to_target');

        Feedback::updateOrCreate(
            [
                'sender_id' => $request->user()->id,
                'module_id' => $validated['module_id'] ?? null,
                'target_assistant_id' => $validated['target_assistant_id'] ?? null,
            ],
            $validated
        );

        if (! empty($validated['target_assistant_id']) && ! empty($validated['module_id'])) {
            AssistantModuleParticipant::firstOrCreate([
                'assistant_id' => $validated['target_assistant_id'],
                'module_id' => $validated['module_id'],
                'participant_id' => $request->user()->id,
            ]);
        }

        return back()->with('success', 'Feedback berhasil dikirim!');
    }
}
