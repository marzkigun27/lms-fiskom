<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Semester;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ModuleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Modules/Index', [
            'modules' => Module::with('semester')->orderBy('order_number')->get()->map(fn (Module $module): array => [
                ...$module->toArray(),
                'name' => $module->title,
                'is_active' => $module->status === 'published',
            ]),
            'semesters' => Semester::query()->orderByDesc('starts_at')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $module = Module::create($this->validated($request));

        return to_route('assistant.soal.index')->with('success', "Modul {$module->title} berhasil dibuat.");
    }

    public function update(Request $request, Module $module): RedirectResponse
    {
        $module->update($this->validated($request, $module));

        return to_route('assistant.soal.index')->with('success', "Modul {$module->title} berhasil diperbarui.");
    }

    public function destroy(Module $module): RedirectResponse
    {
        $module->delete();

        return to_route('assistant.soal.index')->with('success', 'Modul berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Module $module = null): array
    {
        $semesterId = $request->integer('semester_id') ?: Semester::query()->where('is_active', true)->value('id');
        abort_unless($semesterId, 422, 'An active semester is required.');
        $title = $request->input('title', $request->input('name'));
        $code = $request->input('code') ?: 'MOD-'.Str::upper(Str::slug((string) $title, '-'));
        $orderNumber = $request->integer('order_number') ?: $request->integer('week_number', 1);
        $status = $request->input('status') ?: ($request->boolean('is_active') ? 'published' : 'draft');
        $request->merge([
            'semester_id' => $semesterId,
            'title' => $title,
            'code' => $code,
            'order_number' => $orderNumber,
            'status' => $status,
        ]);

        $uniqueCode = Rule::unique('modules', 'code')->where('semester_id', $semesterId)->withoutTrashed();
        $uniqueOrder = Rule::unique('modules', 'order_number')->where('semester_id', $semesterId)->withoutTrashed();
        if ($module) {
            $uniqueCode = $uniqueCode->ignore($module->id);
            $uniqueOrder = $uniqueOrder->ignore($module->id);
        }

        return $request->validate([
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            'code' => ['required', 'string', 'max:50', $uniqueCode],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'order_number' => ['required', 'integer', 'min:1', $uniqueOrder],
            'status' => ['required', 'in:draft,published,archived'],
            'published_at' => ['nullable', 'date'],
        ]);
    }
}
