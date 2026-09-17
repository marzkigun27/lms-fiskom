# Authentication Hardening Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Memperbaiki autentikasi LMS agar alur login/registrasi, role Participant/Assistant/Admin, redirect dashboard, authorization route, ownership data, dan test isolation sesuai PRD.

**Architecture:** Gunakan Spatie Laravel Permission sebagai sumber otorisasi kanonik karena package, `HasRoles`, dan permission migrations sudah tersedia. Kolom legacy `users.role` tetap dipertahankan sementara untuk kompatibilitas redirect/seed lama, tetapi setiap request domain harus diverifikasi melalui role/permission middleware dan policy. Registrasi publik hanya boleh menghasilkan Participant; Assistant dan Admin dibuat/provisioned melalui jalur administratif.

**Tech Stack:** Laravel 13, Fortify, Inertia React, Spatie Laravel Permission, Pest, MySQL, Reverb/Horizon.

---

## Current Context and Confirmed Problems

Audit terhadap `/home/lms/lms-comics-2/lms-comics` menemukan:

- `User` menggunakan `Spatie\\Permission\\Traits\\HasRoles` dan juga memiliki helper `isAdmin()`, `isAssistant()`, `isParticipant()` berbasis kolom `users.role`.
- Route domain di `routes/web.php` memakai `auth`, tetapi route Participant, Assistant, dan Admin belum memakai role/permission middleware.
- `DashboardController` melakukan redirect berdasarkan `users.role` tanpa fallback authorization policy.
- Controller Assistant mengambil data global tanpa scope ownership.
- `HorizonServiceProvider` memiliki gate dengan allow-list email kosong.
- `CreateNewUser`/Fortify registration perlu dipastikan tidak memungkinkan user publik mendaftarkan role privileged.
- Tidak ditemukan test komprehensif untuk role isolation.
- TypeScript check saat audit gagal di `resources/js/pages/Participant/Workspace/Show.tsx:131`; ini bukan perubahan autentikasi langsung, tetapi harus tetap menjadi quality gate sebelum merge.
- Test command saat audit berhenti sebelum suite dengan `ValueError: First element must contain a non-empty program name`; test runner perlu diperbaiki atau diisolasi saat task verification.

---

## Decisions and Non-Goals

### Decisions

1. Spatie Permission menjadi sumber kebenaran untuk authorization.
2. Role yang digunakan persis:
   - `participant`
   - `assistant`
   - `admin`
3. Registrasi publik selalu membuat `participant`.
4. Tidak menerima `role` dari request registration sebagai input yang dipercaya.
5. Redirect dashboard tetap dapat menggunakan role compatibility helper hanya setelah role canonical dipastikan ada.
6. Assistant hanya melihat class/group/participant/session/submission yang menjadi tanggung jawabnya.
7. Admin boleh mengakses management global.

### Non-goals

- Tidak membangun seluruh Participant/Assistant/Admin Management pada fase autentikasi.
- Tidak mengubah visual design secara besar.
- Tidak menjalankan atau memvalidasi code peserta.
- Tidak menghapus kolom `users.role` pada fase pertama tanpa migration compatibility dan approval terpisah.

---

## Phase 1 — Establish Authentication Contract

### Task 1: Document role and permission matrix

**Objective:** Menetapkan permission yang akan digunakan sebelum middleware dan policy dibuat.

**Files:**

- Create: `docs/auth-permission-matrix.md` atau file dokumentasi yang telah disetujui project.
- Inspect/modify only if needed: `PRD.md` (jangan ubah requirement asli tanpa persetujuan).

**Matrix minimum:**

| Area | Participant | Assistant | Admin |
|---|---:|---:|---:|
| Participant dashboard/workspace/own grades | Yes | No | Optional read |
| Submit own answer | Yes | No | No |
| View assigned participants | No | Yes | Yes |
| Operate assigned practicum session | No | Yes | Yes |
| Grade assigned submissions | No | Yes | Yes |
| Manage modules/questions | No | Permission-based | Yes |
| Manage participants/assistants | No | No | Yes |
| Global practicum state | No | No | Yes |
| Horizon | No | Optional | Yes |

**Verification:** Review matrix against PRD sections 4–18 before coding.

### Task 2: Add deterministic role seeding

**Objective:** Memastikan tiga role canonical selalu tersedia pada local/test database.

**Files:**

- Modify: `database/seeders/DatabaseSeeder.php`
- Create if needed: `database/seeders/RolePermissionSeeder.php`
- Inspect: `database/migrations/2026_09_01_041744_create_permission_tables.php`
- Test: `tests/Feature/Auth/RoleProvisioningTest.php`

**Implementation details:**

- Create roles idempotently with `Role::findOrCreate()`.
- Define permissions with stable names such as `practicum.view`, `practicum.manage`, `submissions.grade`, `participants.manage`, `assistants.manage`, `state.manage`, and `horizon.view`.
- Assign broad admin permissions to `admin`.
- Assign only operational permissions to `assistant`.
- Assign participant self-service permissions to `participant`.
- Do not use production passwords or secrets in the seeder.

**TDD:**

1. Add a test asserting the three roles exist after seeding.
2. Run the test and confirm it fails before the seeder implementation.
3. Implement the idempotent seeder.
4. Run the test again and confirm it passes.

**Verification:**

```bash
php artisan db:seed --class=RolePermissionSeeder --no-interaction
php artisan tinker --execute='dump(Spatie\Permission\Models\Role::pluck("name"));'
```

### Task 3: Make User role assignment canonical

**Objective:** Menyamakan role compatibility column dan Spatie role tanpa mempercayai input user.

**Files:**

- Modify: `app/Models/User.php`
- Modify: `app/Actions/Fortify/CreateNewUser.php`
- Modify: `database/factories/UserFactory.php`
- Test: `tests/Feature/Auth/RegistrationRoleTest.php`

**Implementation details:**

- Keep `users.role` temporarily for compatibility.
- Add a small typed method or model event to synchronize a canonical role assignment when users are created by trusted code.
- Public registration must assign `participant` regardless of submitted extra fields.
- Factory states should provide explicit `participant`, `assistant`, and `admin` states.
- Reject or ignore `role` from untrusted registration payload.
- Do not allow mass assignment to elevate a user.

**Tests:**

- Public registration creates a participant.
- Submitted `role=admin` cannot create an admin.
- Trusted factory/admin provisioning creates the expected Spatie role.
- Existing users with a valid legacy role can be synchronized safely.

---

## Phase 2 — Route and Dashboard Authorization

### Task 4: Add role middleware aliases/configuration

**Objective:** Menyediakan middleware yang dapat dipakai secara eksplisit di route groups.

**Files:**

- Inspect/modify: `bootstrap/app.php`
- Create only if package middleware alias is insufficient: `app/Http/Middleware/EnsureRole.php`
- Test: `tests/Feature/Auth/RoleRouteAccessTest.php`

**Implementation details:**

- Prefer Spatie middleware aliases (`role`, `permission`) if supported by installed version.
- If a custom middleware is required, return `403` for authenticated users with the wrong role and preserve normal unauthenticated redirect to login.
- Avoid checking only a `role` request parameter.
- Keep `auth` and `verified` separate so the route contract is clear.

**Verification:** Assert middleware registration through route behavior, not only string inspection.

### Task 5: Apply authorization to `routes/web.php`

**Objective:** Mencegah participant membuka Assistant/Admin route dan sebaliknya.

**Files:**

- Modify: `routes/web.php`
- Modify if needed: `routes/settings.php`
- Test: `tests/Feature/Auth/RoleRouteAccessTest.php`

**Target groups:**

```text
participant routes:
  auth + verified + role:participant

assistant routes:
  auth + verified + role:assistant|admin

admin routes:
  auth + verified + role:admin
```

Use named routes and route parameters consistently. Keep invitation/settings routes outside domain role groups when they are intended for all authenticated users.

**Tests:**

- Guest is redirected to login.
- Unverified user cannot enter verified domain routes.
- Participant receives `403` on assistant/admin route.
- Assistant receives `403` on admin-only route.
- Admin can access admin route.
- Correct role can access its dashboard.

### Task 6: Harden dashboard redirect

**Objective:** Membuat post-login redirect aman dan konsisten dengan canonical role.

**Files:**

- Modify: `app/Http/Controllers/DashboardController.php`
- Possibly modify: `app/Http/Responses/LoginResponse.php`
- Test: `tests/Feature/Auth/DashboardRedirectTest.php`

**Implementation details:**

- Use one canonical role lookup method.
- Redirect participant to `participant.dashboard`.
- Redirect assistant to `assistant.dashboard`.
- Redirect admin to an admin landing page that is actually authorized.
- Handle a user with no recognized role using a safe `403` or dedicated onboarding page; never silently expose generic privileged content.
- Preserve pending team invitation behavior only where it remains compatible with role redirect.

---

## Phase 3 — Fortify Login and Registration Hardening

### Task 7: Inspect and lock Fortify feature configuration

**Objective:** Memastikan login, registration, email verification, password reset, and 2FA behavior are explicit.

**Files:**

- Inspect/modify: `config/fortify.php`
- Inspect/modify: `app/Providers/FortifyServiceProvider.php`
- Inspect: `routes/settings.php`
- Test: `tests/Feature/Auth/AuthenticationTest.php`
- Test: `tests/Feature/Auth/RegistrationTest.php`

**Implementation details:**

- Keep email/password login through Fortify.
- Ensure login throttling is enabled/configured.
- Ensure email verification requirement matches protected routes.
- Ensure password reset does not leak whether an email exists.
- Ensure registration validation includes unique email, strong password rules, and no privileged role input.
- Confirm session regeneration on successful authentication and logout invalidation.

### Task 8: Make landing page login modes meaningful

**Objective:** Memastikan pilihan `Login Praktikan` dan `Login Asisten` tidak hanya bersifat visual.

**Files:**

- Modify: `resources/js/pages/welcome.tsx`
- Inspect/modify: `resources/js/pages/auth/login.tsx`
- Modify if needed: `app/Providers/FortifyServiceProvider.php`
- Test: `tests/Feature/Auth/LoginRoleFlowTest.php`

**Implementation options:**

- Preferred: both modes use the same secure Fortify login endpoint, with a post-login role redirect.
- Optional: mode stores a non-authoritative intended role in session and rejects login if the actual role does not match, without ever granting access based on the selected mode.

**Important:** The selected UI mode must never assign or elevate a role.

**Tests:**

- Participant login lands at participant dashboard.
- Assistant login lands at assistant dashboard.
- Admin login lands at admin dashboard.
- Wrong mode does not bypass role authorization.
- Invalid credentials return generic errors.

---

## Phase 4 — Policies and Ownership Boundaries

### Task 9: Create practicum authorization policies

**Objective:** Membatasi resource berdasarkan ownership/assignment, bukan hanya role.

**Files:**

- Create: `app/Policies/PracticumSessionPolicy.php`
- Create: `app/Policies/SubmissionPolicy.php`
- Create: `app/Policies/GradePolicy.php`
- Create: `app/Policies/QuestionPolicy.php`
- Create if needed: `app/Policies/ParticipantPolicy.php`
- Modify: `app/Providers/AppServiceProvider.php` or policy registration location used by Laravel 13
- Tests: `tests/Feature/Auth/OwnershipAuthorizationTest.php`

**Rules:**

- Participant can view/modify only own submissions.
- Participant cannot grade or manage questions/modules.
- Assistant can operate only sessions/groups/classes assigned to that assistant.
- Assistant can grade only submissions belonging to assigned participants.
- Admin can manage globally.
- A valid role without ownership must still receive `403`.

### Task 10: Replace global controller queries with authorized queries

**Objective:** Menghilangkan data leakage dari controller yang saat ini memakai `get()`/`all()` secara global.

**Files:**

- Modify: `app/Http/Controllers/Assistant/PracticumController.php`
- Modify: `app/Http/Controllers/Assistant/GradingController.php`
- Modify: `app/Http/Controllers/Participant/WorkspaceController.php`
- Modify: `app/Http/Controllers/Participant/GradesController.php`
- Modify: `app/Http/Controllers/Participant/DashboardController.php`
- Modify: `app/Http/Controllers/Assistant/DashboardController.php`
- Tests: `tests/Feature/Auth/OwnershipAuthorizationTest.php`

**Implementation details:**

- Use policies and/or query scopes for ownership.
- Filter participant workspace by the authenticated participant’s assignment.
- Filter assistant sessions, groups, submissions, and grades by assigned scope.
- Ensure route model binding cannot be used to access an unrelated record.
- Return only the props required by the current user.

**Verification:** Create two assistants and two groups in tests; each assistant must see only its own records.

### Task 11: Restrict Horizon access

**Objective:** Menentukan akses Horizon secara explicit.

**Files:**

- Modify: `app/Providers/HorizonServiceProvider.php`
- Test: `tests/Feature/Auth/HorizonAuthorizationTest.php`

**Implementation details:**

- Permit only admin by default.
- Optionally permit assistant only if the permission matrix explicitly requires it.
- Do not use an empty email allow-list as the only authorization mechanism.
- Keep local convenience behavior only if it does not weaken non-local environments.

---

## Phase 5 — Authentication UI States and Error Handling

### Task 12: Standardize auth page states

**Objective:** Menampilkan state loading, validation error, authentication error, verification, and disabled state consistently.

**Files:**

- Modify: `resources/js/pages/auth/login.tsx`
- Modify: `resources/js/pages/auth/register.tsx`
- Modify: `resources/js/pages/auth/forgot-password.tsx`
- Modify: `resources/js/pages/auth/reset-password.tsx`
- Modify: `resources/js/pages/auth/verify-email.tsx`
- Modify if needed: reusable `resources/js/components/input-error.tsx`, `resources/js/components/alert-error.tsx`
- Test: browser/feature tests as available

**Implementation details:**

- Disable submit while processing.
- Display server-side validation errors without exposing sensitive details.
- Preserve intended role only as non-authoritative UI/session context.
- Add clear unauthorized/forbidden state for users attempting an incorrect role route.
- Keep styling consistent with `DESIGN.md` and Stitch references.

### Task 13: Remove misleading privileged links for unauthorized users

**Objective:** Menyesuaikan navigation dengan role tanpa menjadikan frontend sebagai security boundary.

**Files:**

- Inspect/modify: `resources/js/components/app-sidebar.tsx`
- Inspect/modify: `resources/js/components/nav-main.tsx`
- Inspect/modify: `resources/js/pages/Participant/Dashboard.tsx`
- Inspect/modify: `resources/js/pages/Assistant/Dashboard.tsx`
- Modify shared Inertia props location, likely `app/Http/Middleware/HandleInertiaRequests.php`
- Test: `tests/Feature/Auth/NavigationVisibilityTest.php`

**Implementation details:**

- Share explicit `auth.user.role` and permitted navigation capabilities.
- Render only relevant links.
- Treat this as UX only; route middleware/policies remain mandatory.
- Remove dead links such as `/asisten/sesi-aktif` if no route exists, or create a separately planned feature ticket.

---

## Phase 6 — Tests and Quality Gates

### Task 14: Build complete authentication feature test matrix

**Objective:** Membuktikan authentication and authorization behavior end-to-end.

**Files:**

- Modify/create: `tests/Feature/Auth/AuthenticationTest.php`
- Modify/create: `tests/Feature/Auth/RegistrationRoleTest.php`
- Create: `tests/Feature/Auth/RoleRouteAccessTest.php`
- Create: `tests/Feature/Auth/DashboardRedirectTest.php`
- Create: `tests/Feature/Auth/OwnershipAuthorizationTest.php`
- Create: `tests/Feature/Auth/HorizonAuthorizationTest.php`

**Required cases:**

- Guest redirect.
- Successful login and session regeneration.
- Failed login generic response.
- Logout invalidates session.
- Public registration always creates participant.
- Privileged registration injection fails.
- Role-based dashboard redirect.
- Participant/assistant/admin route isolation.
- Ownership isolation across assistants/participants.
- Unverified account restrictions.
- Horizon admin-only access.
- CSRF-protected state-changing requests.

**Run:**

```bash
php artisan test --compact tests/Feature/Auth
```

Expected: all authentication tests pass with no authorization regression.

### Task 15: Fix existing quality blockers before declaring authentication complete

**Objective:** Menutup blockers yang dapat membuat hasil autentikasi tidak dapat diverifikasi.

**Files:**

- Modify: `resources/js/pages/Participant/Workspace/Show.tsx` for the existing nullable TypeScript error, only if necessary.
- Inspect/modify: `package.json`, `vite.config.ts`, and WSL runtime PATH for Node/Bun/Vite Plus mismatch.
- Inspect test bootstrap/Composer scripts for the Symfony Process `ValueError`.

**Verification:**

```bash
bun run types:check
bun run build
php artisan test --compact
```

Do not mark the authentication phase complete if the auth test suite is not executable or if the build is broken by the development runtime.

---

## Phase 7 — Documentation and Handoff

### Task 16: Document authentication behavior

**Objective:** Membuat role behavior dan command verification dapat dipahami developer berikutnya.

**Files:**

- Modify: `README.md`
- Create if project convention allows: `docs/auth-permission-matrix.md`
- Modify only placeholders: `.env.example` if auth-related environment variables are needed

**Document:**

- Public registration creates Participant.
- How Assistant/Admin accounts are provisioned locally.
- Role and permission matrix.
- Dashboard URLs/routes by role.
- How to run auth tests.
- How to reset local roles/permissions safely.
- How Horizon authorization differs between local and production.
- No real credentials or secrets.

---

## Acceptance Criteria

Authentication hardening is complete only when all criteria pass:

1. Guest users cannot access protected routes.
2. Email verification rules are enforced where required.
3. Public registration cannot create Assistant or Admin.
4. Participant, Assistant, and Admin roles are seeded idempotently.
5. Dashboard redirect is deterministic and safe for all three roles.
6. Participant routes cannot be accessed by Assistant/Admin unless explicitly allowed.
7. Assistant routes cannot be accessed by Participant.
8. Admin-only routes cannot be accessed by Participant or Assistant.
9. Assistant data is scoped to assigned classes/groups/participants.
10. Participant submissions/grades are scoped to the authenticated participant.
11. Horizon access is explicitly authorized.
12. Frontend navigation reflects permissions without relying on it for security.
13. Authentication feature tests cover both allowed and denied paths.
14. TypeScript check, frontend build, and Laravel auth tests pass.
15. No real password, API key, or secret is added to Git or documentation.

## Risks and Open Questions

- The project contains both a legacy `users.role` column and Spatie roles. Removing the column immediately risks breaking existing redirect/seed code; use a compatibility phase first.
- The current data model does not yet represent complete assistant assignment/ownership. Full ownership authorization requires the assignment schema to be finalized before controller scoping can be considered complete.
- The intended assistant/admin provisioning UX is not yet specified in the PRD. Phase 1 should use a trusted seeder/CLI path, not public registration.
- The project has no Git metadata in this directory. Create a repository or use another review mechanism before large implementation work so authentication changes can be reviewed and reverted safely.
- The current root `supervisor.conf` is not the active process manager configuration. Authentication implementation should not assume Supervisor runtime state until that separate concern is standardized.

## Suggested Implementation Order

```text
1. Role/permission matrix
2. Idempotent role seeding
3. Registration role hardening
4. Middleware aliases and route groups
5. Dashboard redirect
6. Policies and ownership scope
7. Horizon gate
8. Auth UI/navigation states
9. Feature test matrix
10. Build/test/runtime quality gates
11. Documentation
```

This plan intentionally stops before modifying any application source.
