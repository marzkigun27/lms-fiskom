<?php

namespace App\Http\Controllers\Assistant;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackController extends Controller
{
    public function index(): Response
    {
        $feedbackItems = Feedback::with(['sender', 'module', 'targetAssistant'])
            ->latest()
            ->get();

        return Inertia::render('Assistant/Feedback/Index', [
            'feedbackItems' => $feedbackItems,
        ]);
    }

    public function update(Request $request, Feedback $feedback): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:submitted,reviewed,archived',
        ]);

        $feedback->update($validated);

        return back()->with('success', 'Status feedback berhasil diperbarui.');
    }
}
