<?php

namespace App\Services\GlobalControl;

use App\Models\AuditLog;
use App\Models\Semester;
use App\Models\User;
use App\Models\Vote;
use App\Models\VoteCategory;
use App\Models\VotePeriod;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class VotingControlService
{
    /**
     * Get or initialize current voting period for the active semester.
     */
    public function getOrCreateCurrentPeriod(int $userId): VotePeriod
    {
        $semester = Semester::where('is_active', true)->first() ?? Semester::latest()->first();

        $period = VotePeriod::where('semester_id', $semester?->id)->latest()->first();

        if (! $period) {
            $now = Carbon::now();
            $period = VotePeriod::create([
                'semester_id' => $semester?->id ?? 1,
                'title' => 'Pemilihan Asisten Terbaik '.($semester?->name ?? 'Semester Aktif'),
                'opens_at' => $now->copy()->addDays(1)->setTime(9, 0, 0),
                'closes_at' => $now->copy()->addDays(7)->setTime(23, 59, 0),
                'status' => 'draft',
                'created_by' => $userId,
            ]);

            // Seed default categories if none exist
            $defaultCategories = [
                ['name' => 'Asisten Terbaik', 'description' => 'Asisten dengan performa pengajaran dan sikap paling teladan secara keseluruhan.', 'order_number' => 1],
                ['name' => 'Asisten Teramah', 'description' => 'Asisten yang paling ramah, sabar, dan bersahabat dalam membimbing praktikan.', 'order_number' => 2],
                ['name' => 'Asisten Terfavorit', 'description' => 'Asisten yang paling disukai dan dinantikan kehadirannya oleh praktikan.', 'order_number' => 3],
                ['name' => 'Asisten Paling Informatif', 'description' => 'Asisten dengan penjelasan materi paling jelas, komprehensif, dan mudah dipahami.', 'order_number' => 4],
            ];

            foreach ($defaultCategories as $cat) {
                VoteCategory::create([
                    'vote_period_id' => $period->id,
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'order_number' => $cat['order_number'],
                    'is_active' => true,
                ]);
            }
        }

        return $period;
    }

    /**
     * Get voting state for the assistant control panel.
     */
    public function getVotingState(int $userId): array
    {
        $period = $this->getOrCreateCurrentPeriod($userId);
        $period->load(['categories.votes', 'semester']);

        $categories = $period->categories->map(function (VoteCategory $cat) {
            $votesCount = $cat->votes->count();

            return [
                'id' => $cat->id,
                'name' => $cat->name,
                'description' => $cat->description,
                'order_number' => $cat->order_number,
                'is_active' => $cat->is_active,
                'total_votes' => $votesCount,
            ];
        })->toArray();

        $totalVoters = Vote::where('vote_period_id', $period->id)
            ->distinct('voter_id')
            ->count('voter_id');

        return [
            'period' => [
                'id' => $period->id,
                'title' => $period->title,
                'opens_at' => $period->opens_at->toIso8601String(),
                'closes_at' => $period->closes_at->toIso8601String(),
                'opens_at_formatted' => $period->opens_at->translatedFormat('d M Y H:i'),
                'closes_at_formatted' => $period->closes_at->translatedFormat('d M Y H:i'),
                'status' => $period->status,
                'computed_status' => $period->computed_status,
                'status_label' => $period->status_label,
            ],
            'categories' => $categories,
            'total_voters' => $totalVoters,
        ];
    }

    /**
     * Update voting period schedule and active status.
     */
    public function updatePeriodSchedule(
        int $periodId,
        string $title,
        Carbon $opensAt,
        Carbon $closesAt,
        string $status,
        int $userId
    ): VotePeriod {
        if ($closesAt->lte($opensAt)) {
            throw ValidationException::withMessages([
                'voting_period' => 'Waktu berakhir voting harus lebih besar dari waktu mulai.',
            ]);
        }

        $period = VotePeriod::findOrFail($periodId);

        $oldValues = [
            'title' => $period->title,
            'opens_at' => $period->opens_at->toDateTimeString(),
            'closes_at' => $period->closes_at->toDateTimeString(),
            'status' => $period->status,
        ];

        $period->update([
            'title' => $title,
            'opens_at' => $opensAt,
            'closes_at' => $closesAt,
            'status' => $status,
        ]);

        $newValues = [
            'title' => $period->title,
            'opens_at' => $period->opens_at->toDateTimeString(),
            'closes_at' => $period->closes_at->toDateTimeString(),
            'status' => $period->status,
        ];

        AuditLog::record('voting.period_updated', $period, $oldValues, $newValues, $userId);

        return $period;
    }

    /**
     * Create or update a voting category.
     */
    public function saveCategory(
        int $periodId,
        ?int $categoryId,
        string $name,
        ?string $description,
        int $orderNumber,
        bool $isActive,
        int $userId
    ): VoteCategory {
        $existingName = VoteCategory::where('vote_period_id', $periodId)
            ->where('name', $name)
            ->when($categoryId, fn ($q) => $q->where('id', '!=', $categoryId))
            ->exists();

        if ($existingName) {
            throw ValidationException::withMessages([
                'name' => 'Kategori dengan nama tersebut sudah ada pada periode voting ini.',
            ]);
        }

        if ($categoryId) {
            $category = VoteCategory::where('vote_period_id', $periodId)->findOrFail($categoryId);
            $oldValues = $category->toArray();

            $category->update([
                'name' => $name,
                'description' => $description,
                'order_number' => $orderNumber,
                'is_active' => $isActive,
            ]);

            AuditLog::record('voting.category_updated', $category, $oldValues, $category->toArray(), $userId);
        } else {
            $category = VoteCategory::create([
                'vote_period_id' => $periodId,
                'name' => $name,
                'description' => $description,
                'order_number' => $orderNumber,
                'is_active' => $isActive,
            ]);

            AuditLog::record('voting.category_created', $category, null, $category->toArray(), $userId);
        }

        return $category;
    }

    /**
     * Delete or safely deactivate a category.
     */
    public function deleteCategory(int $categoryId, int $userId): array
    {
        $category = VoteCategory::findOrFail($categoryId);
        $hasVotes = $category->votes()->exists();

        $oldValues = $category->toArray();

        if ($hasVotes) {
            $category->update(['is_active' => false]);
            AuditLog::record('voting.category_deactivated', $category, $oldValues, $category->toArray(), $userId);

            return [
                'action' => 'deactivated',
                'message' => 'Kategori dinonaktifkan karena telah memiliki data suara tersimpan.',
            ];
        }

        $category->delete();
        AuditLog::record('voting.category_deleted', $category, $oldValues, null, $userId);

        return [
            'action' => 'deleted',
            'message' => 'Kategori berhasil dihapus.',
        ];
    }

    /**
     * Submit participant votes.
     *
     * @param  array<int, int>  $categoryVotes  [category_id => assistant_id]
     */
    public function submitParticipantVotes(User $voter, array $categoryVotes): void
    {
        $period = $this->getOrCreateCurrentPeriod($voter->id);

        if (! $period->isOngoing()) {
            throw ValidationException::withMessages([
                'voting' => 'Periode voting saat ini sedang tidak aktif.',
            ]);
        }

        $activeCategories = $period->activeCategories()->pluck('id')->toArray();

        foreach ($categoryVotes as $categoryId => $assistantId) {
            if (! in_array($categoryId, $activeCategories)) {
                continue;
            }

            // Verify assistant exists
            $assistantExists = User::where('id', $assistantId)
                ->where('user_type', 'assistant')
                ->exists();

            if (! $assistantExists) {
                continue;
            }

            Vote::updateOrCreate(
                [
                    'vote_period_id' => $period->id,
                    'vote_category_id' => $categoryId,
                    'voter_id' => $voter->id,
                ],
                [
                    'assistant_id' => $assistantId,
                ]
            );
        }
    }
}
