<?php

namespace App\Http\Controllers\Assistant;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $participants = User::whereIn('user_type', ['participant', 'assistant'])
            ->with(['enrollments.class', 'enrollments.group', 'assistantAssignments.class', 'assistantAssignments.group'])
            ->orderBy('user_type')
            ->orderBy('name')
            ->get();

        return Inertia::render('Assistant/ParticipantManagement/Index', [
            'participants' => $participants,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'identity_number' => 'nullable|string|max:50|unique:users',
            'user_type' => ['required', Rule::in(['participant', 'assistant'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => 'nullable|string|min:8',
        ]);

        if (empty($validated['password'])) {
            $validated['password'] = Hash::make('password'); // Default password
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        User::create($validated);

        return redirect()->back()->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function update(Request $request, User $peserta): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($peserta->id)],
            'identity_number' => ['nullable', 'string', 'max:50', Rule::unique('users')->ignore($peserta->id)],
            'user_type' => ['required', Rule::in(['participant', 'assistant'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => 'nullable|string|min:8',
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $peserta->update($validated);

        return redirect()->back()->with('success', 'Data pengguna berhasil diperbarui.');
    }

    public function destroy(User $peserta): RedirectResponse
    {
        $peserta->delete();

        return redirect()->back()->with('success', 'Pengguna berhasil dihapus.');
    }
}
