<?php

namespace App\Http\Controllers\Assistant;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Module;
use App\Models\PreliminaryTaskPeriod;
use App\Models\VoteCategory;
use App\Services\GlobalControl\PreliminaryTaskService;
use App\Services\GlobalControl\RegistrationControlService;
use App\Services\GlobalControl\VotingControlService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GlobalControlController extends Controller
{
    public function __construct(
        private PreliminaryTaskService $preliminaryTaskService,
        private RegistrationControlService $registrationControlService,
        private VotingControlService $votingControlService
    ) {}

    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $prelabModules = $this->preliminaryTaskService->getModulesWithPrelabData();

        // Provide even-week templates for each module
        $modulesWithTemplates = collect($prelabModules)->map(function ($mod) {
            $template = $this->preliminaryTaskService->getDefaultEvenWeekTemplate((int) ($mod['order_number'] ?? 1));

            return [
                ...$mod,
                'default_template' => [
                    'academic_week' => $template['academic_week'],
                    'opens_at' => $template['opens_at']->toIso8601String(),
                    'deadline_at' => $template['deadline_at']->toIso8601String(),
                    'opens_at_formatted' => $template['opens_at']->translatedFormat('d M Y H:i'),
                    'deadline_at_formatted' => $template['deadline_at']->translatedFormat('d M Y H:i'),
                    'semester_name' => $template['semester_name'],
                ],
            ];
        })->toArray();

        $registrationState = $this->registrationControlService->getState();
        $votingState = $this->votingControlService->getVotingState($userId);

        $auditLogs = AuditLog::with('actor:id,name,identity_number,user_type')
            ->latest()
            ->take(20)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'actor_name' => $log->actor?->name ?? 'Sistem',
                'action' => $log->action,
                'auditable_type' => class_basename($log->auditable_type),
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'created_at_formatted' => $log->created_at->translatedFormat('d M Y H:i:s'),
            ]);

        return Inertia::render('Assistant/GlobalControl/Index', [
            'prelab' => [
                'modules' => $modulesWithTemplates,
            ],
            'registration' => $registrationState,
            'voting' => $votingState,
            'audit_logs' => $auditLogs,
        ]);
    }

    public function updatePrelabSchedule(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'module_id' => ['required', 'exists:modules,id'],
            'opens_at' => ['required', 'date'],
            'deadline_at' => ['required', 'date', 'after:opens_at'],
        ]);

        $this->preliminaryTaskService->saveSchedule(
            (int) $validated['module_id'],
            Carbon::parse($validated['opens_at']),
            Carbon::parse($validated['deadline_at']),
            $request->user()->id
        );

        return redirect()->back()->with('success', 'Jadwal Tugas Pendahuluan berhasil disimpan.');
    }

    public function togglePrelabStatus(PreliminaryTaskPeriod $period, Request $request): RedirectResponse
    {
        $this->preliminaryTaskService->togglePeriod($period, $request->user()->id);

        return redirect()->back()->with(
            'success',
            $period->state === 'closed' ? 'Tugas Pendahuluan dinonaktifkan.' : 'Tugas Pendahuluan diaktifkan kembali.'
        );
    }

    public function updateRegistration(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['nullable', 'string', 'in:participant,assistant,asisten,praktikan'],
            'is_enabled' => ['required', 'boolean'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date'],
        ]);

        $role = $validated['role'] ?? 'participant';

        $this->registrationControlService->updateSettings(
            $role,
            (bool) $validated['is_enabled'],
            $validated['start_at'] ? Carbon::parse($validated['start_at']) : null,
            $validated['end_at'] ? Carbon::parse($validated['end_at']) : null,
            $request->user()->id
        );

        $roleLabel = ($role === 'assistant' || $role === 'asisten') ? 'asisten' : 'praktikan';

        return redirect()->back()->with('success', "Pengaturan registrasi {$roleLabel} berhasil diperbarui.");
    }

    public function updateVotingPeriod(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'period_id' => ['required', 'exists:vote_periods,id'],
            'title' => ['required', 'string', 'max:255'],
            'opens_at' => ['required', 'date'],
            'closes_at' => ['required', 'date', 'after:opens_at'],
            'status' => ['required', 'in:draft,active,closed'],
        ]);

        $this->votingControlService->updatePeriodSchedule(
            (int) $validated['period_id'],
            $validated['title'],
            Carbon::parse($validated['opens_at']),
            Carbon::parse($validated['closes_at']),
            $validated['status'],
            $request->user()->id
        );

        return redirect()->back()->with('success', 'Jadwal dan status voting berhasil diperbarui.');
    }

    public function storeVotingCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'period_id' => ['required', 'exists:vote_periods,id'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'order_number' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
        ]);

        $this->votingControlService->saveCategory(
            (int) $validated['period_id'],
            null,
            $validated['name'],
            $validated['description'] ?? null,
            (int) $validated['order_number'],
            (bool) $validated['is_active'],
            $request->user()->id
        );

        return redirect()->back()->with('success', 'Kategori voting berhasil ditambahkan.');
    }

    public function updateVotingCategory(Request $request, VoteCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'order_number' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
        ]);

        $this->votingControlService->saveCategory(
            $category->vote_period_id,
            $category->id,
            $validated['name'],
            $validated['description'] ?? null,
            (int) $validated['order_number'],
            (bool) $validated['is_active'],
            $request->user()->id
        );

        return redirect()->back()->with('success', 'Kategori voting berhasil diperbarui.');
    }

    public function destroyVotingCategory(VoteCategory $category, Request $request): RedirectResponse
    {
        $result = $this->votingControlService->deleteCategory($category->id, $request->user()->id);

        return redirect()->back()->with('success', $result['message']);
    }
}
