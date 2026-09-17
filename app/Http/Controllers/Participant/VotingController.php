<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vote;
use App\Services\GlobalControl\VotingControlService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VotingController extends Controller
{
    public function __construct(
        private VotingControlService $votingControlService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $period = $this->votingControlService->getOrCreateCurrentPeriod($user->id);

        $categories = $period->activeCategories()
            ->orderBy('order_number')
            ->get(['id', 'name', 'description', 'order_number'])
            ->toArray();

        $assistants = User::where('user_type', 'assistant')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'identity_number'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'identity_number' => $u->identity_number,
                'avatar' => 'https://api.dicebear.com/7.x/notionists/svg?seed='.urlencode($u->name).'&backgroundColor=fce4b3',
            ])
            ->toArray();

        $myVotes = Vote::where('voter_id', $user->id)
            ->where('vote_period_id', $period->id)
            ->pluck('assistant_id', 'vote_category_id')
            ->toArray();

        return Inertia::render('Participant/Voting', [
            'period' => [
                'id' => $period->id,
                'title' => $period->title,
                'opens_at' => $period->opens_at->toIso8601String(),
                'closes_at' => $period->closes_at->toIso8601String(),
                'opens_at_formatted' => $period->opens_at->translatedFormat('d M Y H:i'),
                'closes_at_formatted' => $period->closes_at->translatedFormat('d M Y H:i'),
                'is_ongoing' => $period->isOngoing(),
                'computed_status' => $period->computed_status,
                'status_label' => $period->status_label,
            ],
            'categories' => $categories,
            'assistants' => $assistants,
            'my_votes' => $myVotes,
        ]);
    }

    public function submit(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'votes' => ['required', 'array', 'min:1'],
            'votes.*' => ['required', 'integer', 'exists:users,id'],
        ]);

        $this->votingControlService->submitParticipantVotes($request->user(), $validated['votes']);

        return redirect()->back()->with('success', 'Voting berhasil disimpan! Terima kasih atas partisipasi Anda.');
    }
}
