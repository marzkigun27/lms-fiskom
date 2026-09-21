<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Question;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    public function index(Request $request): Response
    {
        $moduleId = $request->integer('module_id') ?: null;

        return Inertia::render('Admin/Questions/Index', [
            'questions' => Question::with('module')
                ->when($moduleId, fn ($query) => $query->where('module_id', $moduleId))
                ->orderBy('order_number')
                ->get(),
            'modules' => Module::query()->whereIn('status', ['draft', 'published'])->orderBy('order_number')->get(),
            'currentModuleId' => $moduleId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $question = Question::create($this->validated($request));

        return to_route('assistant.soal.index')->with('success', "Soal #{$question->order_number} berhasil dibuat.");
    }

    public function update(Request $request, Question $question): RedirectResponse
    {
        $question->update($this->validated($request, $question));

        return to_route('assistant.soal.index')->with('success', "Soal #{$question->order_number} berhasil diperbarui.");
    }

    public function destroy(Question $question): RedirectResponse
    {
        $question->delete();

        return to_route('assistant.soal.index')->with('success', 'Soal berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Question $question = null): array
    {
        $uniqueOrder = Rule::unique('questions', 'order_number')
            ->where('module_id', $request->integer('module_id'))
            ->where('session_type', $request->string('session_type')->value())
            ->withoutTrashed();
        if ($question) {
            $uniqueOrder = $uniqueOrder->ignore($question->id);
        }

        return [
            ...$request->validate([
                'module_id' => ['required', 'integer', 'exists:modules,id'],
                'session_type' => ['required', 'in:preliminary,initial_task,journal,independent_task'],
                'description' => ['required', 'string'],
                'answer_type' => ['required', 'in:text,code,file'],
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
