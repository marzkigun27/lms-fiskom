<?php

namespace App\Http\Controllers\Assistant;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Question;
use App\Models\Semester;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class QuestionManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $moduleId = $request->integer('module_id') ?: null;

        return Inertia::render('Assistant/QuestionManagement/Index', [
            'questions' => Question::with('module')
                ->when($moduleId, fn ($query) => $query->where('module_id', $moduleId))
                ->orderBy('module_id')
                ->orderBy('session_type')
                ->orderBy('order_number')
                ->get(),
            'modules' => Module::query()
                ->whereIn('status', ['draft', 'published'])
                ->orderBy('order_number')
                ->get(),
            'currentModuleId' => $moduleId,
            'semesters' => Semester::query()->orderByDesc('starts_at')->get(),
        ]);
    }

    public function moduleStore(Request $request): RedirectResponse
    {
        Module::create($this->validatedModule($request));

        return to_route('assistant.soal.index')->with('success', 'Modul berhasil dibuat.');
    }

    public function moduleUpdate(Request $request, Module $module): RedirectResponse
    {
        $module->update($this->validatedModule($request, $module));

        return to_route('assistant.soal.index')->with('success', 'Modul berhasil diperbarui.');
    }

    public function moduleDestroy(Module $module): RedirectResponse
    {
        $module->delete();

        return to_route('assistant.soal.index')->with('success', 'Modul berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function validatedModule(Request $request, ?Module $module = null): array
    {
        $semesterId = $request->integer('semester_id') ?: Semester::query()->where('is_active', true)->value('id');
        if (! $semesterId) {
            throw ValidationException::withMessages([
                'semester_id' => 'An active semester is required.',
            ]);
        }
        $codeRule = Rule::unique('modules', 'code')->where('semester_id', $semesterId);
        $orderRule = Rule::unique('modules', 'order_number')->where('semester_id', $semesterId);
        if ($module) {
            $codeRule = $codeRule->ignore($module->id);
            $orderRule = $orderRule->ignore($module->id);
        }

        return $request->validate([
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'code' => ['required', 'string', 'max:50', $codeRule],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'order_number' => ['required', 'integer', 'min:1', $orderRule],
            'status' => ['required', 'in:draft,published,archived'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    public function batchUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.description' => ['required', 'string'],
            'questions.*.answer_type' => ['required', 'in:text,code'],
            'questions.*.programming_language' => ['nullable', 'string', 'max:50'],
            'questions.*.session_type' => ['required', 'in:preliminary,initial_task,journal,independent_task'],
            'questions.*.order_number' => ['required', 'integer', 'min:1'],
            'questions.*.is_required' => ['required', 'boolean'],
            'questions.*.status' => ['required', 'in:draft,published,archived'],
        ]);

        DB::transaction(function () use ($validated, $request): void {
            $existingIds = collect($validated['questions'])->pluck('id')->filter()->values();
            if ($existingIds->isNotEmpty()) {
                abort_unless(
                    Question::whereIn('id', $existingIds)->where('module_id', $validated['module_id'])->count() === $existingIds->count(),
                    422,
                    'All questions must belong to the selected module.'
                );

                foreach ($existingIds as $id) {
                    Question::whereKey($id)->update(['order_number' => -$id]);
                }
            }

            $seen = [];
            foreach ($validated['questions'] as $questionData) {
                $key = $questionData['session_type'].'-'.$questionData['order_number'];
                abort_if(isset($seen[$key]), 422, 'Duplicate question order in batch.');
                $seen[$key] = true;

                if (! empty($questionData['id'])) {
                    $question = Question::findOrFail($questionData['id']);
                    $question->update([
                        ...collect($questionData)->except('id')->all(),
                        'updated_by' => $request->user()->id,
                    ]);
                } else {
                    Question::create([
                        ...collect($questionData)->except('id')->all(),
                        'module_id' => $validated['module_id'],
                        'created_by' => $request->user()->id,
                        'updated_by' => $request->user()->id,
                    ]);
                }
            }
        });

        return to_route('assistant.soal.index')->with('success', 'Daftar soal berhasil diperbarui.');
    }

    public function store(Request $request): RedirectResponse
    {
        $question = Question::create($this->validated($request));

        return to_route('assistant.soal.index')->with('success', "Soal #{$question->order_number} berhasil dibuat.");
    }

    public function update(Request $request, Question $soal): RedirectResponse
    {
        $soal->update($this->validated($request, $soal));

        return to_route('assistant.soal.index')->with('success', "Soal #{$soal->order_number} berhasil diperbarui.");
    }

    public function destroy(Question $soal): RedirectResponse
    {
        $soal->delete();

        return to_route('assistant.soal.index')->with('success', 'Soal berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Question $question = null): array
    {
        $uniqueOrder = Rule::unique('questions', 'order_number')
            ->where('module_id', $request->integer('module_id'))
            ->where('session_type', $request->string('session_type')->value());

        if ($question) {
            $uniqueOrder = $uniqueOrder->ignore($question->id);
        }

        return [
            ...$request->validate([
                'module_id' => ['required', 'integer', 'exists:modules,id'],
                'session_type' => ['required', 'in:preliminary,initial_task,journal,independent_task'],
                'description' => ['required', 'string'],
                'answer_type' => ['required', 'in:text,code'],
                'programming_language' => ['nullable', 'string', 'max:50'],
                'order_number' => ['required', 'integer', 'min:1', $uniqueOrder],
                'is_required' => ['required', 'boolean'],
                'status' => ['required', 'in:draft,published,archived'],
            ]),
            'created_by' => $question?->created_by ?? $request->user()->id,
            'updated_by' => $request->user()->id,
        ];
    }
}
