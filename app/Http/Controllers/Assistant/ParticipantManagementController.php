<?php

namespace App\Http\Controllers\Assistant;

use App\Actions\Teams\CreateTeam;
use App\Http\Controllers\Controller;
use App\Http\Requests\Assistant\WeeklyScheduleRequest;
use App\Models\Group;
use App\Models\ParticipantEnrollment;
use App\Models\PracticumClass;
use App\Models\Semester;
use App\Models\User;
use App\Models\WeeklySchedule;
use App\Models\WeeklyScheduleGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

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

    public function store(Request $request, CreateTeam $createTeam): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users',
            'identity_number' => 'nullable|string|max:50|unique:users',
            'user_type' => ['required', Rule::in(['participant', 'assistant'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => 'nullable|string|min:8',
        ]);

        if (empty($validated['password'])) {
            $defaultPassword = ! empty($validated['identity_number']) ? $validated['identity_number'] : 'password';
            $validated['password'] = Hash::make($defaultPassword);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user = User::create($validated);
        $user->assignRole(Role::findOrCreate($validated['user_type'], 'web'));
        $createTeam->handle($user, $user->name."'s Team", isPersonal: true);

        return redirect()->back()->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function update(Request $request, User $peserta): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('users')->ignore($peserta->id)],
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
        DB::transaction(function () use ($peserta) {
            $peserta->enrollments()->delete();
            $peserta->assistantAssignments()->delete();
            DB::table('weekly_schedule_group_member')->where('participant_id', $peserta->id)->delete();
            DB::table('weekly_schedule_assistant')->where('assistant_id', $peserta->id)->delete();

            foreach ($peserta->ownedTeams as $team) {
                $team->members()->detach();
                $team->forceDelete();
            }
            $peserta->teams()->detach();

            $hasSubmissions = DB::table('submissions')->where('participant_id', $peserta->id)->exists()
                || DB::table('answers')->where('participant_id', $peserta->id)->exists()
                || DB::table('grades')->where('participant_id', $peserta->id)->exists();

            if (! $hasSubmissions) {
                $peserta->forceDelete();
            } else {
                $peserta->delete();
            }
        });

        return redirect()->back()->with('success', 'Pengguna berhasil dihapus.');
    }

    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="template_bulk_praktikan.csv"',
        ];

        $content = "nama,nim,kelas,shift,kelompok\n"
            ."Ahmad Dahlan,1301210001,PHY-101,Senin - Shift 1 (06:30 - 09:30),K-01\n"
            ."Budi Santoso,1301210002,PHY-101,Senin - Shift 1 (06:30 - 09:30),K-01\n"
            ."Citra Lestari,1301210003,PHY-101,Senin - Shift 1 (06:30 - 09:30),K-02\n";

        return response($content, 200, $headers);
    }

    public function bulkStore(Request $request, CreateTeam $createTeam): RedirectResponse
    {
        $request->validate([
            'file' => [
                'nullable',
                'file',
                'max:10240',
                function ($attribute, $value, $fail) {
                    if ($value instanceof UploadedFile) {
                        $ext = strtolower($value->getClientOriginalExtension());
                        if (! in_array($ext, ['csv', 'txt', 'tsv'])) {
                            $fail('File harus berformat .csv atau .txt.');
                        }
                    }
                },
            ],
            'raw_data' => 'nullable|string',
        ]);

        $content = '';
        if ($request->hasFile('file')) {
            $content = file_get_contents($request->file('file')->getRealPath());
        } elseif ($request->filled('raw_data')) {
            $content = $request->string('raw_data')->value();
        }

        // Strip UTF-8 BOM if present (e.g. from Excel exports)
        $content = preg_replace('/^\xEF\xBB\xBF/', '', (string) $content);

        if (empty(trim($content))) {
            return back()->withErrors(['raw_data' => 'File atau data teks bulk upload tidak boleh kosong.']);
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($content));
        if (empty($lines)) {
            return back()->withErrors(['raw_data' => 'Format data tidak valid.']);
        }

        $activeSemester = Semester::where('is_active', true)->first();
        $semesterId = $activeSemester?->id;

        $createdCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;

        $firstLine = $lines[0];
        $delimiter = str_contains($firstLine, ';') ? ';' : (str_contains($firstLine, "\t") ? "\t" : ',');

        $headerRow = str_getcsv($firstLine, $delimiter, '"', '\\');
        $headerNormalized = array_map(fn ($h) => strtolower(trim($h)), $headerRow);

        $hasHeader = in_array('nim', $headerNormalized)
            || in_array('nama', $headerNormalized)
            || in_array('name', $headerNormalized)
            || in_array('identity_number', $headerNormalized);

        $startIndex = $hasHeader ? 1 : 0;

        $colIndices = [
            'nama' => $hasHeader ? null : 0,
            'nim' => $hasHeader ? null : 1,
            'kelas' => $hasHeader ? null : 2,
            'shift' => $hasHeader ? null : 3,
            'kelompok' => $hasHeader ? null : 4,
        ];

        if ($hasHeader) {
            foreach ($headerNormalized as $idx => $rawName) {
                $name = preg_replace('/[^\w\-]/', '', $rawName);
                if (in_array($name, ['nama', 'name', 'full_name', 'fullname'])) {
                    $colIndices['nama'] = $idx;
                } elseif (in_array($name, ['nim', 'identity_number', 'username', 'no_induk', 'id'])) {
                    $colIndices['nim'] = $idx;
                } elseif (in_array($name, ['kelas', 'class', 'kode_kelas', 'nama_kelas'])) {
                    $colIndices['kelas'] = $idx;
                } elseif (in_array($name, ['shift', 'jadwal', 'jadwal_shift'])) {
                    $colIndices['shift'] = $idx;
                } elseif (in_array($name, ['kelompok', 'group', 'kode_kelompok', 'group_code'])) {
                    $colIndices['kelompok'] = $idx;
                }
            }

            // Fallback positional if header exists but 'nim' was not matched by name
            if ($colIndices['nim'] === null) {
                $colIndices['nama'] = $colIndices['nama'] ?? 0;
                $colIndices['nim'] = 1;
                $colIndices['kelas'] = count($headerRow) >= 5 ? 2 : null;
                $colIndices['shift'] = count($headerRow) >= 5 ? 3 : 2;
                $colIndices['kelompok'] = count($headerRow) >= 5 ? 4 : 3;
            }
        }

        DB::transaction(function () use ($lines, $startIndex, $delimiter, $colIndices, $semesterId, $createTeam, &$createdCount, &$updatedCount, &$skippedCount) {
            for ($i = $startIndex; $i < count($lines); $i++) {
                $line = trim($lines[$i]);
                if ($line === '') {
                    continue;
                }

                $row = str_getcsv($line, $delimiter, '"', '\\');
                $nim = ($colIndices['nim'] !== null && isset($row[$colIndices['nim']])) ? trim($row[$colIndices['nim']]) : '';
                if ($nim === '') {
                    $skippedCount++;

                    continue;
                }

                // Handle scientific notation from Excel (e.g. 1.01042E+11)
                if (preg_match('/^[0-9.]+[eE]\+[0-9]+$/', $nim)) {
                    $nim = sprintf('%.0f', (float) $nim);
                }

                $name = ($colIndices['nama'] !== null && isset($row[$colIndices['nama']])) ? trim($row[$colIndices['nama']]) : '';
                if ($name === '') {
                    $name = $nim;
                }

                $classInput = ($colIndices['kelas'] !== null && isset($row[$colIndices['kelas']])) ? trim($row[$colIndices['kelas']]) : '';
                $shiftInput = ($colIndices['shift'] !== null && isset($row[$colIndices['shift']])) ? trim($row[$colIndices['shift']]) : '';
                $groupInput = ($colIndices['kelompok'] !== null && isset($row[$colIndices['kelompok']])) ? trim($row[$colIndices['kelompok']]) : '';

                $user = User::where('identity_number', $nim)->first();
                if (! $user) {
                    $user = User::create([
                        'name' => $name,
                        'identity_number' => $nim,
                        'email' => null,
                        'password' => Hash::make($nim),
                        'user_type' => 'participant',
                        'status' => 'active',
                    ]);
                    $user->assignRole(Role::findOrCreate('participant', 'web'));
                    $createTeam->handle($user, $user->name."'s Team", isPersonal: true);
                    $createdCount++;
                } else {
                    $user->update([
                        'name' => $name ?: $user->name,
                        'status' => 'active',
                    ]);
                    $updatedCount++;
                }

                if (! $semesterId) {
                    continue;
                }

                // 1. Resolve Class (opsional, auto-create if specified but not exists)
                $class = null;
                if ($classInput !== '') {
                    $class = PracticumClass::where('semester_id', $semesterId)
                        ->where(function ($q) use ($classInput) {
                            $q->where('code', $classInput)
                                ->orWhere('name', $classInput)
                                ->orWhere('code', 'like', "%{$classInput}%")
                                ->orWhere('name', 'like', "%{$classInput}%");
                        })->first();

                    if (! $class) {
                        $class = PracticumClass::firstOrCreate(
                            ['semester_id' => $semesterId, 'code' => $classInput],
                            ['name' => $classInput, 'status' => 'active']
                        );
                    }
                }

                // 2. Resolve WeeklySchedule (Shift, auto-create if not exists)
                $schedule = null;
                if ($shiftInput !== '') {
                    $schedules = WeeklySchedule::where('semester_id', $semesterId)->get();

                    // Parse day and shift from input
                    $validDays = WeeklyScheduleRequest::DAYS;
                    $detectedDay = null;
                    $shiftPart = $shiftInput;

                    // Match day if explicitly present
                    foreach ($validDays as $vd) {
                        if (preg_match('/\b'.preg_quote($vd, '/').'\b/i', $shiftInput)) {
                            $detectedDay = $vd;
                            // Remove day word from shiftPart
                            $shiftPart = trim(preg_replace('/\b'.preg_quote($vd, '/').'\b/i', '', $shiftInput));
                            $shiftPart = trim(trim($shiftPart, '-:;, '));
                            break;
                        }
                    }

                    // Extract shift number if present (e.g. "Shift 1" -> 1, "1" -> 1)
                    $shiftNumber = null;
                    if (preg_match('/\b(?:shift\s*)?(\d+)\b/i', $shiftPart, $sm)) {
                        $shiftNumber = (int) $sm[1];
                    }

                    // Multi-tier matching against existing schedules
                    // Tier 1: Exact label match ("Day - Shift")
                    $schedule = $schedules->first(function ($ws) use ($shiftInput) {
                        return strcasecmp("{$ws->day} - {$ws->shift}", $shiftInput) === 0;
                    });

                    // Tier 2: Exact day + exact shift name
                    if (! $schedule && $detectedDay) {
                        $schedule = $schedules->first(function ($ws) use ($detectedDay, $shiftPart) {
                            return strcasecmp($ws->day, $detectedDay) === 0
                                && (strcasecmp($ws->shift, $shiftPart) === 0 || strcasecmp($ws->shift, 'Shift '.$shiftPart) === 0);
                        });
                    }

                    // Tier 3: Matching day + matching shift number (word boundary, so Shift 1 won't match Shift 10)
                    if (! $schedule && $detectedDay && $shiftNumber !== null) {
                        $schedule = $schedules->first(function ($ws) use ($detectedDay, $shiftNumber) {
                            if (strcasecmp($ws->day, $detectedDay) !== 0) {
                                return false;
                            }
                            if (preg_match('/\b(?:shift\s*)?(\d+)\b/i', $ws->shift, $wsm)) {
                                return (int) $wsm[1] === $shiftNumber;
                            }

                            return false;
                        });
                    }

                    // Tier 4: No day detected, but exact shift name or exact shift number
                    if (! $schedule && ! $detectedDay) {
                        if ($shiftNumber !== null) {
                            $schedule = $schedules->first(function ($ws) use ($shiftNumber) {
                                if (preg_match('/\b(?:shift\s*)?(\d+)\b/i', $ws->shift, $wsm)) {
                                    return (int) $wsm[1] === $shiftNumber;
                                }

                                return false;
                            });
                        }
                        if (! $schedule) {
                            $schedule = $schedules->first(function ($ws) use ($shiftPart) {
                                return strcasecmp($ws->shift, $shiftPart) === 0;
                            });
                        }
                    }

                    // Auto-create schedule if still not found
                    if (! $schedule) {
                        $day = $detectedDay ?: 'Senin';
                        $shiftName = $shiftPart ?: $shiftInput;

                        $schedule = WeeklySchedule::firstOrCreate(
                            ['semester_id' => $semesterId, 'day' => $day, 'shift' => $shiftName]
                        );
                    }
                }

                // 3. Resolve WeeklyScheduleGroup
                $weeklyGroup = null;
                if ($schedule && $groupInput !== '') {
                    $cleanGroup = trim($groupInput);

                    // A. Exact code match (case-insensitive)
                    $weeklyGroup = $schedule->groups()->whereRaw('LOWER(code) = ?', [strtolower($cleanGroup)])->first();

                    // B. Numeric match ONLY IF input is pure numeric or "Kelompok X" AND candidate has no conflicting custom code
                    if (! $weeklyGroup && preg_match('/^(?:kelompok|klp|k)?[-\s]*(\d+)$/i', $cleanGroup, $gm)) {
                        $targetNum = (int) $gm[1];
                        $candidate = $schedule->groups()->where('number', $targetNum)->first();
                        if ($candidate && (empty($candidate->code) || strcasecmp($candidate->code, $cleanGroup) === 0 || $candidate->code === (string) $targetNum)) {
                            if (empty($candidate->code) && ! is_numeric($cleanGroup)) {
                                $candidate->update(['code' => $cleanGroup]);
                            }
                            $weeklyGroup = $candidate;
                        }
                    }

                    // C. Create new group if not found
                    if (! $weeklyGroup) {
                        $takenNumbers = $schedule->groups()->pluck('number')->all();

                        // Try to use number extracted from groupInput if available and not yet taken
                        $preferredNum = preg_match('/\d+/', $cleanGroup, $nm) ? (int) $nm[0] : null;
                        if ($preferredNum !== null && $preferredNum >= 1 && $preferredNum <= 255 && ! in_array($preferredNum, $takenNumbers, true)) {
                            $newNumber = $preferredNum;
                        } else {
                            $newNumber = 1;
                            while (in_array($newNumber, $takenNumbers, true)) {
                                $newNumber++;
                            }
                        }

                        $weeklyGroup = WeeklyScheduleGroup::create([
                            'weekly_schedule_id' => $schedule->id,
                            'number' => $newNumber,
                            'code' => $cleanGroup,
                        ]);
                    }

                    // D. Detach participant from any OTHER weekly schedule groups in this semester to prevent split/ghost memberships
                    $otherGroupIds = WeeklyScheduleGroup::whereHas('schedule', function ($q) use ($semesterId) {
                        $q->where('semester_id', $semesterId);
                    })->where('id', '!=', $weeklyGroup->id)->pluck('id');

                    if ($otherGroupIds->isNotEmpty()) {
                        DB::table('weekly_schedule_group_member')
                            ->where('participant_id', $user->id)
                            ->whereIn('weekly_schedule_group_id', $otherGroupIds)
                            ->delete();
                    }

                    $weeklyGroup->members()->syncWithoutDetaching([$user->id]);
                }

                // 4. Enroll in PracticumClass
                if ($class) {
                    $classGroup = null;
                    if ($weeklyGroup) {
                        $grpCode = $weeklyGroup->code ?: (string) $weeklyGroup->number;

                        // Match exact code first
                        $classGroup = Group::where('class_id', $class->id)
                            ->where('code', $grpCode)
                            ->first();

                        if (! $classGroup) {
                            // Exact match on number or exact name "Kelompok {$grpCode}"
                            $classGroup = Group::where('class_id', $class->id)
                                ->where(function ($q) use ($grpCode, $weeklyGroup) {
                                    $q->where('code', (string) $weeklyGroup->number)
                                        ->orWhere('name', 'Kelompok '.$grpCode)
                                        ->orWhere('name', 'Kelompok '.$weeklyGroup->number);
                                })->first();
                        }

                        if (! $classGroup) {
                            $classGroup = Group::create(
                                ['class_id' => $class->id, 'code' => $grpCode, 'name' => 'Kelompok '.$grpCode, 'status' => 'active']
                            );
                        }
                    }

                    ParticipantEnrollment::updateOrCreate(
                        ['semester_id' => $semesterId, 'participant_id' => $user->id],
                        [
                            'class_id' => $class->id,
                            'group_id' => $classGroup?->id,
                            'status' => 'active',
                            'enrolled_at' => now(),
                        ]
                    );
                }
            }
        });

        if ($createdCount === 0 && $updatedCount === 0) {
            return redirect()->back()->with('error', 'Tidak ada data praktikan yang berhasil diproses. Pastikan file CSV memiliki data dengan NIM yang valid.');
        }

        $msg = "Bulk upload berhasil: {$createdCount} praktikan baru ditambahkan";
        if ($updatedCount > 0) {
            $msg .= ", {$updatedCount} diperbarui";
        }
        if ($skippedCount > 0) {
            $msg .= ", {$skippedCount} baris dilewati";
        }
        $msg .= '.';

        return redirect()->back()->with('success', $msg);
    }
}
