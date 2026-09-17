# Product Requirements Document (PRD)

## LMS Praktikum Pengolahan Sinyal

**Status:** Draft siap implementasi  
**Target pengguna:** Praktikan, Asisten, dan Admin  
**Platform:** Web application, desktop-first dan responsif  
**Dokumen untuk:** AI coding agent, developer, dan reviewer produk

---

## 1. Ringkasan Produk

Bangun Learning Management System (LMS) yang dirancang khusus untuk mengelola praktikum Pengolahan Sinyal. Sistem harus mendukung persiapan sebelum praktikum, pelaksanaan sesi, pengerjaan soal, penyimpanan jawaban, submission, pemantauan peserta secara realtime, penilaian, feedback, dan evaluasi akhir.

Alur utama setiap modul:

`Tugas Pendahuluan → Tugas Awal → Jurnal → Tugas Mandiri`

Workspace peserta hanya menyediakan input jawaban teks dan input source code. Sistem **tidak menjalankan, mengompilasi, atau memvalidasi kode peserta**.

Referensi visual utama tersedia pada:
- `/stitch_computational_physics_lab_portal` jika tersedia di workspace

AI agent wajib memeriksa referensi yang benar-benar tersedia sebelum implementasi dan tidak boleh mengarang isi referensi yang tidak ditemukan.

---

## 2. Tujuan Produk

1. Mengintegrasikan seluruh workflow praktikum dalam satu sistem.
2. Menyediakan workspace pengerjaan soal yang terstruktur dan aman dari kehilangan jawaban.
3. Memungkinkan asisten mengendalikan sesi serta memantau progres peserta secara realtime.
4. Memastikan akses data mengikuti kelas, kelompok, asisten pembimbing, dan role pengguna.
5. Menyediakan proses penilaian yang dapat diaudit.

### Indikator keberhasilan

- Peserta dapat menyelesaikan seluruh tahap praktikum tanpa berpindah platform untuk administrasi dan submission.
- Perubahan state sesi terlihat oleh peserta dan asisten tanpa reload manual.
- Draft jawaban tetap tersimpan ketika peserta berpindah soal atau koneksi terputus sementara.
- Asisten biasa hanya dapat melihat dan menilai peserta yang menjadi tanggung jawabnya.
- Setiap perubahan nilai mempunyai riwayat pelaku dan waktu perubahan.

---

## 3. Ruang Lingkup

### 3.1 Termasuk dalam MVP

- Landing page dan autentikasi.
- Role-Based Access Control (RBAC): Praktikan, Asisten, dan Admin.
- Pengelolaan semester, modul, kelas, kelompok, jadwal, peserta, dan asisten.
- Empat jenis sesi praktikum.
- Workspace jawaban teks dan source code tanpa eksekusi.
- Save draft, submit, timestamp, dan progres pengerjaan.
- Kontrol state praktikum dan sesi.
- Monitoring peserta secara realtime.
- Pengelolaan soal.
- Input nilai dan audit log nilai.
- Tampilan nilai peserta.
- Announcement.
- Feedback umum, personal, dan pertanyaan berbentuk thread sederhana.
- Voting asisten setelah periode praktikum selesai.
- UX state: loading, empty, error, unauthorized, offline, waiting, active, submitted, dan completed.

### 3.2 Di luar ruang lingkup

- Python runtime atau code execution service.
- Tombol Run/Execute.
- Output cell, terminal, console, atau notebook environment.
- Integrasi Jupyter Notebook atau Google Colab.
- Automatic code validation, grading berbasis eksekusi, atau plot rendering.
- Video conference dan live streaming.
- Plagiarism detection.
- Aplikasi mobile native.

---

## 4. Pengguna dan Hak Akses

| Kapabilitas | Praktikan | Asisten | Admin |
| --- | :---: | :---: | :---: |
| Melihat dashboard pribadi | Ya | Ya | Ya |
| Mengerjakan dan submit jawaban sendiri | Ya | Tidak | Tidak |
| Melihat nilai sendiri | Ya | Tidak | Tidak |
| Mengontrol sesi kelas yang dijaga | Tidak | Ya | Ya |
| Memantau peserta tanggung jawab | Tidak | Ya | Ya |
| Menilai peserta tanggung jawab | Tidak | Ya | Ya |
| Mengelola soal | Tidak | Sesuai permission | Ya |
| Mengelola peserta/asisten secara global | Tidak | Tidak | Ya |
| Mengatur state global dan semester | Tidak | Tidak | Ya |
| Melihat audit log | Tidak | Terbatas | Ya |

Aturan otorisasi harus diberlakukan pada server, bukan hanya dengan menyembunyikan menu di frontend.

---

## 5. Struktur Akademik

Hierarki organisasi:

`Semester → Modul → Jadwal Praktikum → Kelas → Kelompok → Asisten Pembimbing → Praktikan`

Ketentuan awal:

- Satu jadwal praktikum umumnya diikuti 20–30 praktikan.
- Satu asisten membimbing sekitar empat praktikan.
- Assignment dapat berubah antarsemester dan harus disimpan sebagai data historis.
- Semua query monitoring dan penilaian asisten harus dibatasi berdasarkan assignment aktif.

---

## 6. Alur dan Aturan Sesi

### 6.1 Tugas Pendahuluan

- Dikerjakan sebelum jadwal praktikum, umumnya dalam periode sekitar empat hari.
- Periode akses diatur secara global oleh Admin per modul.
- Peserta dapat menyimpan draft selama periode aktif.
- Setelah deadline, submission baru dan perubahan jawaban dinonaktifkan.

### 6.2 Tugas Awal

- Dilaksanakan pada awal jadwal praktikum sebagai pre-test.
- Dibuka dan ditutup oleh Asisten/Admin untuk jadwal atau kelas tertentu.

### 6.3 Jurnal

- Merupakan sesi utama praktikum.
- Peserta mengerjakan rangkaian soal dengan bimbingan asisten.
- Dibuka dan ditutup oleh Asisten/Admin.

### 6.4 Tugas Mandiri

- Menjadi evaluasi akhir modul.
- Dibuka dan ditutup oleh Asisten/Admin sesuai konfigurasi jadwal.

### 6.5 State sesi

State minimum:

`scheduled → waiting → active → closed → completed`

Aturan:

- Hanya sesi `active` yang menerima draft dan submission baru.
- Sesi `waiting` hanya menampilkan informasi dan status menunggu.
- Sesi `closed` tidak menerima perubahan, tetapi jawaban dapat dibaca sesuai permission.
- Sesi `completed` bersifat read-only.
- Perubahan state harus dicatat dengan aktor dan timestamp.
- Transisi yang tidak valid harus ditolak oleh server.

---

## 7. Kebutuhan Fungsional

### FR-01 — Landing Page dan Autentikasi

- Landing page berisi hero, ringkasan LMS, informasi praktikum, fitur utama, dan CTA login.
- Sediakan jalur Login Praktikan dan Login Asisten.
- Setelah login, arahkan pengguna ke dashboard sesuai role.
- Pengguna yang tidak terautentikasi tidak dapat mengakses halaman internal.

### FR-02 — Dashboard Asisten

Tampilkan:

- Profil asisten.
- Jadwal mengajar berikutnya.
- Reminder praktikum dan pengisian nilai.
- Praktikum aktif.
- Jumlah peserta bimbingan.
- Pending action.
- Announcement penting.

Navigasi minimum:

- Praktikum Management.
- Nilai Management.
- Soal Management.
- Peserta Management.
- Feedback.
- State Management—Admin only.
- Asisten Management—Admin only.
- Profile/Settings dan Logout.

### FR-03 — Praktikum Management

Asisten/Admin dapat:

- Memulai dan menyelesaikan praktikum sesuai jadwal yang diizinkan.
- Membuka atau menutup Tugas Awal, Jurnal, dan Tugas Mandiri.
- Melihat timer atau durasi sesi.
- Melihat kelas, kelompok, dan peserta.
- Melihat progres serta state peserta secara realtime.
- Membuat laporan ringkas setelah praktikum selesai.

Ringkasan monitoring harus membedakan peserta yang belum mulai, sedang mengerjakan, belum submit, sudah submit, dan selesai.

### FR-04 — Dashboard Praktikan

Tampilkan:

- Profil singkat.
- Jadwal berikutnya.
- Modul aktif.
- Reminder dan deadline Tugas Pendahuluan.
- Progres praktikum.
- Nilai terbaru.
- Announcement.
- Status sesi saat ini.

Navigasi minimum:

- Praktikum.
- Tugas Pendahuluan.
- Lihat Nilai.
- Feedback.
- Voting Asisten.
- Profile/Settings dan Logout.

### FR-05 — Practicum Workspace

Question Area menampilkan:

- Nomor, judul, deskripsi, dan instruksi soal.
- Lampiran/resource jika ada.
- Bobot jika dikonfigurasi.
- Status dan progres soal.

Answer Area menampilkan field berdasarkan tipe soal:

- `text`: textarea jawaban.
- `code`: editor teks kode tanpa execution.

Editor kode diharapkan mendukung monospace, line number, indentation, syntax highlighting, copy/paste, serta horizontal scrolling.

Workspace wajib menyediakan:

- Save Draft.
- Submit Answer dengan konfirmasi.
- Last Saved dan Submitted At.
- Navigasi antarsoal.
- Indikator seperti `Soal 3 dari 8 • 5 terjawab • 3 tersisa`.
- Perlindungan dari kehilangan perubahan yang belum disimpan.

Status jawaban:

`not_started → in_progress → saved → submitted`

Submission bersifat final untuk sesi tersebut, kecuali Admin secara eksplisit membuka kembali jawaban. Tindakan reopen harus masuk audit log.

### FR-06 — Tugas Pendahuluan

- Tampilkan modul, soal, deadline, progres, field jawaban, Save Draft, dan Submit.
- Hak akses mengikuti periode global per modul.
- Setelah periode berakhir, tampilkan pesan bahwa pengerjaan telah ditutup dan jadikan halaman read-only.

### FR-07 — Soal Management

Struktur konten:

`Modul → Jenis Sesi → Soal`

Pengguna berizin dapat membuat, mengedit, menghapus, mengurutkan, memberi bobot, memilih tipe jawaban, menambahkan instruksi/lampiran, dan melakukan preview.

Tipe jawaban MVP: `text` dan `code`.

Soal yang sudah mempunyai submission tidak boleh dihapus permanen; gunakan archive/soft delete agar data historis tetap konsisten.

### FR-08 — Nilai Management

Tabel minimum:

| Peserta | NIM | Kelas | Kelompok | TP | TA | Jurnal | Mandiri | Total | Status |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |

Fitur:

- Input, edit, dan detail nilai.
- Filter modul dan kelas.
- Status penilaian.
- Timestamp input/update.
- Riwayat perubahan nilai.

Setiap perubahan menyimpan nilai lama, nilai baru, pelaku, waktu, dan alasan opsional. Rumus total/bobot harus dikonfigurasi secara konsisten dan dihitung di server.

### FR-09 — Lihat Nilai

- Peserta hanya dapat melihat nilainya sendiri.
- Tampilkan nilai per modul dan sesi: TP, TA, Jurnal, Mandiri, serta total.
- Nilai yang belum dipublikasikan tidak ditampilkan kepada peserta.

### FR-10 — Peserta Management

Kelola nama, NIM, kelas, email, kelompok, asisten pembimbing, dan status.

Fitur minimum:

- Tambah, edit, aktivasi/nonaktifkan.
- Search dan filter kelas.
- Assignment kelompok dan asisten.
- Bulk import sebagai prioritas setelah operasi dasar stabil.

Peserta dengan histori submission tidak boleh dihapus permanen.

### FR-11 — Asisten Management (Admin)

Admin dapat mengelola nama, ID/NIM, email, role, kelas, kelompok bimbingan, status, dan permission asisten.

### FR-12 — State Management (Admin)

Admin dapat mengatur:

- Registrasi akun peserta dan asisten.
- Semester/periode aktif.
- Modul aktif.
- Periode dan deadline Tugas Pendahuluan.
- Announcement global.
- Global practicum state.

State global tidak boleh menimpa histori jadwal atau sesi yang sudah selesai.

### FR-13 — Feedback dan Pertanyaan

Tiga jenis masukan:

- General Feedback.
- Personal Feedback untuk asisten tertentu.
- Question yang membutuhkan respons.

Question menggunakan thread sederhana dengan status `waiting`, `answered`, atau `closed`. Akses thread hanya untuk pengirim, penerima yang berwenang, dan Admin.

### FR-14 — Voting Asisten

- Hanya tersedia pada periode yang dikonfigurasi Admin.
- Kategori dapat dikonfigurasi.
- Satu peserta hanya mempunyai satu vote per kategori dalam satu periode.
- Terapkan unique constraint di database untuk mencegah voting ganda.

### FR-15 — Announcement

- Admin dapat membuat announcement global.
- Asisten yang berizin dapat membuat announcement untuk jadwal/kelasnya.
- Announcement mempunyai periode tampil dan target audiens.

---

## 8. Realtime Requirements

### Assistant/Admin ke Praktikan

- Praktikum dimulai atau selesai.
- Sesi dibuka, ditutup, atau berpindah.
- Sinkronisasi timer.
- Announcement baru.

### Praktikan ke Assistant/Admin

- Online/offline.
- Sesi dan soal aktif.
- Sedang menjawab.
- Draft tersimpan.
- Jawaban submitted.
- Sesi completed.

Ketentuan teknis:

- Gunakan WebSocket/event broadcasting jika tersedia pada stack.
- Server menjadi sumber kebenaran untuk state sesi dan submission.
- Realtime event tidak menggantikan validasi authorization pada API.
- UI harus memiliki fallback reconnect dan menampilkan status koneksi.
- Hindari polling agresif.

---

## 9. Spesifikasi Model Data dan Relasi

Spesifikasi berikut bersifat logical data model. Gunakan `bigint` atau `uuid` untuk primary key sesuai konvensi repository, tetapi gunakan satu strategi secara konsisten. Semua tabel transaksional memiliki `created_at` dan `updated_at`, kecuali disebutkan lain.

### 9.1 Konvensi database

- Foreign key memakai pola `<entity>_id`.
- Gunakan `timestamp with timezone` atau simpan UTC dan konversi di presentation layer.
- Gunakan `decimal`, bukan `float`, untuk nilai.
- Kolom status dapat berupa enum database atau string tervalidasi pada domain layer.
- Tabel akademik yang sudah direferensikan memakai `deleted_at`/soft delete.
- Data sensitif dan token autentikasi mengikuti mekanisme framework dan tidak ditulis ke log.
- Index seluruh foreign key serta kolom yang sering digunakan untuk filter.

### 9.2 Authentication dan RBAC

#### Tabel `users`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `name` | varchar(150) | Required |
| `identity_number` | varchar(50) | NIM/ID pegawai, unique nullable jika admin eksternal |
| `email` | varchar(255) | Required, unique |
| `password_hash` | varchar | Required untuk local auth |
| `user_type` | enum | `participant`, `assistant`, `admin`; untuk klasifikasi cepat, permission tetap dari RBAC |
| `status` | enum | `pending`, `active`, `inactive`, `suspended` |
| `email_verified_at` | timestamp nullable | Verifikasi email |
| `last_login_at` | timestamp nullable | Audit login terakhir |
| `remember_token` | varchar nullable | Jika dibutuhkan framework |
| `deleted_at` | timestamp nullable | Soft delete |

#### Tabel `roles`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `name` | varchar(100) | Unique; contoh `participant`, `assistant`, `admin` |
| `description` | text nullable | Penjelasan role |

#### Tabel `permissions`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `name` | varchar(150) | Unique; contoh `questions.manage` |
| `description` | text nullable | Penjelasan permission |

#### Pivot RBAC

| Tabel | Kolom penting | Constraint |
| --- | --- | --- |
| `role_user` | `role_id`, `user_id` | Unique (`role_id`, `user_id`) |
| `permission_role` | `permission_id`, `role_id` | Unique (`permission_id`, `role_id`) |
| `permission_user` | `permission_id`, `user_id` | Opsional untuk override; unique pasangan |

Relasi:

- `users` M:N `roles` melalui `role_user`.
- `roles` M:N `permissions` melalui `permission_role`.
- `users` M:N `permissions` melalui `permission_user` jika direct permission diperlukan.

### 9.3 Struktur semester, kelas, dan kelompok

#### Tabel `semesters`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `name` | varchar(100) | Contoh `Ganjil 2026/2027` |
| `academic_year` | varchar(20) | Required |
| `term` | enum | `odd`, `even`, `short` |
| `starts_at`, `ends_at` | timestamp | Required, `ends_at > starts_at` |
| `is_active` | boolean | Hanya satu semester aktif jika kebijakan sistem demikian |

#### Tabel `classes`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `semester_id` | FK | → `semesters.id` |
| `code` | varchar(50) | Kode kelas |
| `name` | varchar(100) | Nama kelas |
| `status` | enum | `active`, `inactive`, `archived` |
| `deleted_at` | timestamp nullable | Soft delete |

Unique: (`semester_id`, `code`).

#### Tabel `groups`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `class_id` | FK | → `classes.id` |
| `code` | varchar(50) | Kode kelompok |
| `name` | varchar(100) | Nama kelompok |
| `status` | enum | `active`, `inactive` |
| `deleted_at` | timestamp nullable | Soft delete |

Unique: (`class_id`, `code`).

#### Tabel `participant_enrollments`

Menyimpan keanggotaan peserta per semester agar perpindahan kelas tidak menghapus histori.

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `semester_id` | FK | → `semesters.id` |
| `participant_id` | FK | → `users.id`, harus bertipe participant |
| `class_id` | FK | → `classes.id` |
| `group_id` | FK nullable | → `groups.id`; group harus milik class yang sama |
| `status` | enum | `active`, `inactive`, `withdrawn` |
| `enrolled_at` | timestamp | Required |

Unique: (`semester_id`, `participant_id`). Index: (`class_id`, `group_id`, `status`).

#### Tabel `assistant_assignments`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `semester_id` | FK | → `semesters.id` |
| `assistant_id` | FK | → `users.id`, harus bertipe assistant/admin |
| `class_id` | FK | → `classes.id` |
| `group_id` | FK nullable | Null berarti assignment tingkat kelas |
| `assignment_type` | enum | `teacher`, `mentor`, `observer` |
| `starts_at`, `ends_at` | timestamp nullable | Masa assignment |
| `status` | enum | `active`, `inactive` |

Unique yang disarankan: (`semester_id`, `assistant_id`, `class_id`, `group_id`, `assignment_type`).

Relasi:

- `semesters` 1:N `classes`.
- `classes` 1:N `groups`.
- `users(participant)` M:N `semesters` melalui `participant_enrollments`.
- `users(assistant)` M:N `classes/groups` melalui `assistant_assignments`.

### 9.4 Modul, jadwal, dan sesi praktikum

#### Tabel `modules`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `semester_id` | FK | → `semesters.id` |
| `code` | varchar(50) | Kode modul |
| `title` | varchar(200) | Required |
| `description` | text nullable | Ringkasan modul |
| `order_number` | integer | Urutan modul, > 0 |
| `status` | enum | `draft`, `published`, `archived` |
| `published_at` | timestamp nullable | Waktu publikasi |
| `deleted_at` | timestamp nullable | Soft delete |

Unique: (`semester_id`, `code`) dan (`semester_id`, `order_number`).

#### Tabel `practicum_schedules`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `module_id` | FK | → `modules.id` |
| `class_id` | FK | → `classes.id` |
| `room` | varchar(100) nullable | Lokasi/ruang |
| `starts_at`, `ends_at` | timestamp | Required, `ends_at > starts_at` |
| `status` | enum | `scheduled`, `ongoing`, `completed`, `cancelled` |
| `started_by`, `completed_by` | FK nullable | → `users.id` |
| `actual_started_at`, `actual_completed_at` | timestamp nullable | Waktu aktual |

Unique yang disarankan: (`module_id`, `class_id`). Jika satu kelas dapat beberapa shift, tambahkan `shift_number` ke unique constraint.

#### Tabel `practicum_sessions`

Satu jadwal memiliki Tugas Awal, Jurnal, dan Tugas Mandiri. Tugas Pendahuluan dapat memakai jadwal global modul melalui tabel periode tersendiri.

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `practicum_schedule_id` | FK | → `practicum_schedules.id` |
| `session_type` | enum | `initial_task`, `journal`, `independent_task` |
| `order_number` | integer | Urutan sesi |
| `state` | enum | `scheduled`, `waiting`, `active`, `closed`, `completed` |
| `planned_duration_minutes` | integer nullable | Harus > 0 |
| `opened_at`, `closed_at`, `completed_at` | timestamp nullable | Timestamp state |
| `opened_by`, `closed_by`, `completed_by` | FK nullable | → `users.id` |

Unique: (`practicum_schedule_id`, `session_type`).

#### Tabel `preliminary_task_periods`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `module_id` | FK | → `modules.id` |
| `class_id` | FK nullable | Null berarti berlaku untuk seluruh kelas pada modul |
| `opens_at`, `deadline_at` | timestamp | Required, deadline setelah open |
| `state` | enum | `scheduled`, `active`, `closed` |
| `created_by`, `updated_by` | FK | → `users.id` |

Unique: (`module_id`, `class_id`).

#### Tabel `session_state_histories`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `practicum_session_id` | FK | → `practicum_sessions.id` |
| `from_state`, `to_state` | enum/string | Required |
| `changed_by` | FK | → `users.id` |
| `reason` | text nullable | Alasan perubahan |
| `changed_at` | timestamp | Required, immutable |

Relasi:

- `modules` 1:N `practicum_schedules`.
- `classes` 1:N `practicum_schedules`.
- `practicum_schedules` 1:N `practicum_sessions`.
- `modules` 1:N `preliminary_task_periods`.
- `practicum_sessions` 1:N `session_state_histories`.

### 9.5 Pengelolaan soal dan resource

#### Tabel `questions`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `module_id` | FK | → `modules.id` |
| `session_type` | enum | `preliminary`, `initial_task`, `journal`, `independent_task` |
| `title` | varchar(255) nullable | Judul soal |
| `description` | long text | Isi soal |
| `instructions` | long text nullable | Instruksi tambahan |
| `answer_type` | enum | `text`, `code` |
| `programming_language` | varchar(50) nullable | Hanya metadata syntax highlighting, bukan runtime |
| `weight` | decimal(8,2) | >= 0 |
| `order_number` | integer | > 0 |
| `is_required` | boolean | Default true |
| `status` | enum | `draft`, `published`, `archived` |
| `created_by`, `updated_by` | FK | → `users.id` |
| `deleted_at` | timestamp nullable | Soft delete |

Unique: (`module_id`, `session_type`, `order_number`).

#### Tabel `question_resources`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `question_id` | FK | → `questions.id` |
| `display_name` | varchar(255) | Required |
| `storage_path` | varchar(500) | Jangan simpan file binary langsung di DB |
| `mime_type` | varchar(100) | Required |
| `size_bytes` | bigint | > 0 dan dibatasi konfigurasi |
| `uploaded_by` | FK | → `users.id` |

Relasi:

- `modules` 1:N `questions`.
- `questions` 1:N `question_resources`.
- `questions.session_type` menentukan sesi tempat soal ditampilkan.

### 9.6 Draft jawaban dan submission

#### Tabel `answers`

Satu record menyimpan jawaban terbaru peserta untuk satu soal dalam satu konteks pengerjaan.

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `question_id` | FK | → `questions.id` |
| `participant_id` | FK | → `users.id` |
| `practicum_session_id` | FK nullable | Diisi untuk TA/Jurnal/Mandiri |
| `preliminary_task_period_id` | FK nullable | Diisi untuk TP |
| `content` | long text nullable | Jawaban teks/source code sebagai plain text |
| `status` | enum | `not_started`, `in_progress`, `saved`, `submitted` |
| `last_saved_at` | timestamp nullable | Waktu save berhasil |
| `submitted_at` | timestamp nullable | Waktu final submit |
| `version` | integer | Optimistic locking, mulai dari 1 |

Constraint:

- Tepat satu dari `practicum_session_id` atau `preliminary_task_period_id` harus terisi.
- Unique jawaban per participant-question-context.
- `answer_type` tidak perlu diduplikasi karena berasal dari `questions`.

#### Tabel `submissions`

Menyimpan snapshot final per peserta dan sesi agar perubahan question/answer berikutnya tidak mengubah histori submission.

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `participant_id` | FK | → `users.id` |
| `practicum_session_id` | FK nullable | Konteks sesi praktikum |
| `preliminary_task_period_id` | FK nullable | Konteks TP |
| `status` | enum | `submitted`, `reopened`, `graded` |
| `submitted_at` | timestamp | Required |
| `submitted_by` | FK | Biasanya participant, → `users.id` |
| `reopened_at`, `reopened_by` | timestamp/FK nullable | Reopen oleh Admin |
| `reopen_reason` | text nullable | Wajib jika reopened |
| `attempt_number` | integer | Default 1 |

Unique final submission per participant-context, kecuali kebijakan attempt jamak diaktifkan.

#### Tabel `submission_answers`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `submission_id` | FK | → `submissions.id` |
| `question_id` | FK | → `questions.id` |
| `answer_id` | FK nullable | → `answers.id`, referensi sumber draft |
| `answer_content_snapshot` | long text nullable | Snapshot immutable |
| `question_snapshot` | JSON/text | Judul, instruksi, tipe, dan bobot saat submit |
| `submitted_at` | timestamp | Required |

Unique: (`submission_id`, `question_id`).

Relasi:

- `users(participant)` 1:N `answers`.
- `questions` 1:N `answers`.
- `practicum_sessions` atau `preliminary_task_periods` 1:N `answers`.
- `users(participant)` 1:N `submissions`.
- `submissions` 1:N `submission_answers`.
- `questions` 1:N `submission_answers`.

### 9.7 Kehadiran dan realtime participant state

#### Tabel `attendances`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `practicum_schedule_id` | FK | → `practicum_schedules.id` |
| `participant_id` | FK | → `users.id` |
| `status` | enum | `present`, `late`, `absent`, `excused` |
| `checked_in_at` | timestamp nullable | Waktu hadir |
| `recorded_by` | FK nullable | → `users.id` |
| `notes` | text nullable | Catatan |

Unique: (`practicum_schedule_id`, `participant_id`).

#### Tabel `participant_states`

Berisi state terakhir untuk monitoring cepat; data ini dapat menggunakan Redis/cache dengan persistence opsional.

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key jika disimpan di DB |
| `participant_id` | FK | → `users.id` |
| `practicum_session_id` | FK | → `practicum_sessions.id` |
| `question_id` | FK nullable | → `questions.id` |
| `connection_status` | enum | `online`, `offline` |
| `activity_state` | enum | `waiting`, `viewing`, `answering`, `saved`, `submitted`, `completed` |
| `last_seen_at` | timestamp | Required |
| `updated_at` | timestamp | Required |

Unique: (`participant_id`, `practicum_session_id`). Jangan simpan setiap heartbeat sebagai row baru.

### 9.8 Penilaian dan audit nilai

#### Tabel `grades`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `submission_id` | FK | → `submissions.id` |
| `participant_id` | FK | → `users.id`, didenormalisasi untuk query; harus cocok dengan submission |
| `module_id` | FK | → `modules.id`, harus cocok dengan konteks submission |
| `session_type` | enum | `preliminary`, `initial_task`, `journal`, `independent_task` |
| `score` | decimal(8,2) | >= 0 |
| `max_score` | decimal(8,2) | > 0 |
| `feedback` | text nullable | Feedback penilai |
| `status` | enum | `draft`, `published` |
| `graded_by` | FK | → `users.id` |
| `graded_at`, `published_at` | timestamp nullable | Timestamp proses |
| `version` | integer | Optimistic locking |

Unique: (`submission_id`). Jika grading per soal dibutuhkan, gunakan tabel detail berikut.

#### Tabel `grade_items`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `grade_id` | FK | → `grades.id` |
| `submission_answer_id` | FK | → `submission_answers.id` |
| `score` | decimal(8,2) | >= 0 |
| `max_score` | decimal(8,2) | > 0 |
| `feedback` | text nullable | Feedback per soal |

Unique: (`grade_id`, `submission_answer_id`).

#### Tabel `grade_histories`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `grade_id` | FK | → `grades.id` |
| `old_score`, `new_score` | decimal(8,2) nullable | Nilai sebelum/sesudah |
| `old_status`, `new_status` | enum/string nullable | Status sebelum/sesudah |
| `change_snapshot` | JSON | Perubahan grade dan grade items |
| `changed_by` | FK | → `users.id` |
| `reason` | text nullable | Alasan perubahan |
| `changed_at` | timestamp | Required, immutable |

Relasi:

- `submissions` 1:1 `grades`.
- `grades` 1:N `grade_items`.
- `grades` 1:N `grade_histories`.
- Nilai total modul dihitung dari grade berstatus `published` berdasarkan konfigurasi bobot.

#### Tabel `grading_weights`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `module_id` | FK | → `modules.id` |
| `session_type` | enum | Empat jenis sesi |
| `weight_percent` | decimal(5,2) | 0–100 |
| `created_by`, `updated_by` | FK | → `users.id` |

Unique: (`module_id`, `session_type`). Total bobot satu modul harus 100% ketika konfigurasi dipublikasikan.

### 9.9 Announcement

#### Tabel `announcements`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `title` | varchar(255) | Required |
| `content` | long text | Required |
| `created_by` | FK | → `users.id` |
| `audience_type` | enum | `all`, `role`, `class`, `group`, `schedule` |
| `audience_reference_id` | FK-like nullable | ID target sesuai audience type; validasi di service layer |
| `starts_at`, `ends_at` | timestamp nullable | Periode tampil |
| `published_at` | timestamp nullable | Null berarti draft |
| `priority` | enum | `normal`, `important`, `urgent` |

Untuk referential integrity yang lebih kuat, `audience_reference_id` dapat diganti pivot terpisah seperti `announcement_classes`, `announcement_groups`, dan `announcement_schedules`.

### 9.10 Feedback dan percakapan

#### Tabel `feedback`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `sender_id` | FK | → `users.id` |
| `feedback_type` | enum | `general`, `personal` |
| `target_assistant_id` | FK nullable | → `users.id`, wajib untuk personal |
| `module_id` | FK nullable | → `modules.id` |
| `content` | text | Required |
| `is_anonymous_to_target` | boolean | Identitas tetap tersedia bagi Admin sesuai kebijakan |
| `status` | enum | `submitted`, `reviewed`, `archived` |

#### Tabel `conversations`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `created_by` | FK | → `users.id` |
| `assigned_assistant_id` | FK nullable | → `users.id` |
| `module_id` | FK nullable | → `modules.id` |
| `subject` | varchar(255) | Required |
| `status` | enum | `waiting`, `answered`, `closed` |
| `closed_at`, `closed_by` | timestamp/FK nullable | Penutupan thread |

#### Tabel `conversation_participants`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `conversation_id` | FK | → `conversations.id` |
| `user_id` | FK | → `users.id` |
| `participant_role` | enum | `requester`, `responder`, `observer` |
| `last_read_at` | timestamp nullable | Status baca |

Unique: (`conversation_id`, `user_id`).

#### Tabel `messages`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `conversation_id` | FK | → `conversations.id` |
| `sender_id` | FK | → `users.id` |
| `content` | text | Required |
| `sent_at` | timestamp | Required |
| `edited_at` | timestamp nullable | Jika edit pesan diizinkan |

Relasi:

- `users` 1:N `feedback` sebagai sender.
- `users(assistant)` 1:N `feedback` sebagai target personal.
- `conversations` M:N `users` melalui `conversation_participants`.
- `conversations` 1:N `messages`.

### 9.11 Voting asisten

#### Tabel `vote_periods`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `semester_id` | FK | → `semesters.id` |
| `title` | varchar(255) | Required |
| `opens_at`, `closes_at` | timestamp | Required |
| `status` | enum | `draft`, `active`, `closed` |
| `created_by` | FK | → `users.id` |

#### Tabel `vote_categories`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `vote_period_id` | FK | → `vote_periods.id` |
| `name` | varchar(150) | Required |
| `description` | text nullable | Penjelasan kategori |
| `order_number` | integer | > 0 |
| `is_active` | boolean | Default true |

Unique: (`vote_period_id`, `name`).

#### Tabel `votes`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `vote_period_id` | FK | → `vote_periods.id` |
| `vote_category_id` | FK | → `vote_categories.id` |
| `voter_id` | FK | → `users.id`, participant |
| `assistant_id` | FK | → `users.id`, assistant |
| `created_at` | timestamp | Required |

Unique wajib: (`vote_period_id`, `vote_category_id`, `voter_id`). Validasi kandidat asisten harus berasal dari semester/periode yang sama.

### 9.12 System state dan audit umum

#### Tabel `system_settings`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `key` | varchar(150) | Unique |
| `value` | JSON/text | Nilai konfigurasi |
| `value_type` | enum | `string`, `number`, `boolean`, `json`, `datetime` |
| `updated_by` | FK | → `users.id` |

Gunakan hanya untuk konfigurasi global, bukan menggantikan tabel domain seperti semester atau periode TP.

#### Tabel `audit_logs`

| Kolom | Tipe konseptual | Constraint/Keterangan |
| --- | --- | --- |
| `id` | PK | Primary key |
| `actor_id` | FK nullable | → `users.id`; null untuk system action |
| `action` | varchar(150) | Contoh `submission.reopened` |
| `auditable_type` | varchar(150) | Jenis entity |
| `auditable_id` | PK-like | ID entity |
| `old_values`, `new_values` | JSON nullable | Snapshot perubahan, tanpa secret |
| `ip_address` | varchar nullable | Jika kebijakan privasi mengizinkan |
| `user_agent` | text nullable | Jika diperlukan |
| `created_at` | timestamp | Immutable |

Audit khusus nilai tetap menggunakan `grade_histories`; `audit_logs` mencatat aksi sistem lintas entity.

### 9.13 Ringkasan relasi utama

| Parent | Kardinalitas | Child | Makna |
| --- | --- | --- | --- |
| `semesters` | 1:N | `classes`, `modules`, `vote_periods` | Struktur per periode akademik |
| `classes` | 1:N | `groups`, `practicum_schedules` | Kelas mempunyai kelompok dan jadwal |
| `users(participant)` | 1:N | `participant_enrollments` | Histori keikutsertaan peserta |
| `users(assistant)` | 1:N | `assistant_assignments` | Assignment asisten per kelas/kelompok |
| `modules` | 1:N | `questions`, `practicum_schedules`, `preliminary_task_periods` | Konten dan pelaksanaan modul |
| `practicum_schedules` | 1:N | `practicum_sessions`, `attendances` | Satu jadwal berisi sesi dan absensi |
| `practicum_sessions` | 1:N | `answers`, `submissions`, `participant_states` | Aktivitas peserta pada sesi |
| `questions` | 1:N | `question_resources`, `answers`, `submission_answers` | Soal dan jawaban peserta |
| `submissions` | 1:N | `submission_answers` | Snapshot jawaban final |
| `submissions` | 1:1 | `grades` | Satu submission mempunyai satu grade aggregate |
| `grades` | 1:N | `grade_items`, `grade_histories` | Detail dan histori penilaian |
| `conversations` | 1:N | `messages` | Thread pertanyaan |
| `conversations` | M:N | `users` | Anggota thread melalui pivot |
| `vote_periods` | 1:N | `vote_categories`, `votes` | Voting per periode |

### 9.14 Aturan integritas lintas tabel

- `participant_enrollments.group_id` harus merujuk group dalam `class_id` yang sama.
- Semester pada class, module, enrollment, assignment, schedule, dan vote period harus konsisten.
- Asisten hanya dapat mengontrol schedule yang kelas/kelompoknya tercakup assignment aktif.
- `questions.session_type` harus sama dengan konteks session/period tempat jawaban dibuat.
- Draft hanya dapat diubah oleh pemilik selama konteks aktif.
- Final submission dibuat dalam transaction bersama snapshot seluruh jawaban.
- Submission hanya dapat dinilai oleh asisten berwenang atau Admin.
- `grades.participant_id` dan `module_id` harus cocok dengan submission terkait.
- Grade `published` tidak dapat diedit tanpa membuat `grade_histories`.
- Data source code disimpan sebagai plain text dan selalu di-escape saat ditampilkan.
- Referential action default adalah `restrict`; gunakan `cascade` hanya pada pivot/detail yang tidak bermakna tanpa parent.

### 9.15 Index yang direkomendasikan

- `users(email)`, `users(identity_number)`, `users(status)`.
- `participant_enrollments(participant_id, semester_id)` dan (`class_id`, `group_id`, `status`).
- `assistant_assignments(assistant_id, semester_id, status)`.
- `practicum_schedules(class_id, starts_at, status)`.
- `practicum_sessions(practicum_schedule_id, state)`.
- `questions(module_id, session_type, order_number, status)`.
- `answers(participant_id, practicum_session_id, status)`.
- `submissions(participant_id, submitted_at, status)`.
- `grades(participant_id, module_id, status)`.
- `participant_states(practicum_session_id, activity_state, last_seen_at)`.
- `announcements(published_at, starts_at, ends_at)`.
- `messages(conversation_id, sent_at)`.
- `audit_logs(auditable_type, auditable_id, created_at)`.

---

## 10. Kebutuhan Desain dan UX

Sebelum membangun UI, AI agent harus:

1. Memeriksa seluruh referensi desain yang tersedia.
2. Mengidentifikasi shell aplikasi, sidebar, navbar, card, table, form, typography, spacing, border, radius, iconography, dan interaction pattern.
3. Membentuk design tokens dan reusable components.
4. Menggunakan pola yang konsisten pada seluruh role.

Karakter desain:

- Clean, modern, academic, dan technical.
- Information-dense tetapi tetap mudah dipindai.
- Desktop-first dan responsif untuk tablet/mobile.
- Workspace memprioritaskan keterbacaan soal dan kenyamanan menulis jawaban.
- Status tidak boleh hanya dibedakan dengan warna; gunakan label/icon yang jelas.

Setiap halaman harus menangani loading, empty, error, success, disabled, unauthorized, offline, waiting, active, submitted, dan completed jika relevan.

Komponen umum minimum:

- App shell, sidebar, navbar, breadcrumb.
- Card statistik.
- Data table, filter, search, pagination.
- Form controls dan validation message.
- Modal/confirmation dialog.
- Toast/notification.
- Status badge.
- Skeleton dan empty state.

---

## 11. Non-Functional Requirements

### Keamanan

- Authorization wajib divalidasi pada setiap endpoint/action.
- Validasi dan sanitasi seluruh input pengguna.
- Source code peserta diperlakukan sebagai plain text dan tidak pernah dieksekusi atau dirender sebagai HTML.
- Terapkan CSRF/session protection sesuai framework.
- Batasi upload berdasarkan tipe, ukuran, dan permission.
- Catat perubahan nilai, state penting, dan reopen submission.

### Reliabilitas dan integritas

- Save Draft harus idempotent.
- Cegah duplicate submission akibat double click atau retry jaringan.
- Gunakan transaction pada perubahan state, submission, assignment, dan nilai yang saling terkait.
- Jika realtime gagal, data tetap konsisten setelah refresh/reconnect.

### Performa

- Dashboard dan tabel harus menggunakan pagination/filter server-side untuk data besar.
- Hindari N+1 query.
- Proses bulk import/report besar dapat menggunakan background job.
- Target awal respons interaksi umum di bawah dua detik pada kondisi normal.

### Aksesibilitas

- Navigasi keyboard pada form dan workspace.
- Label form yang jelas.
- Focus state terlihat.
- Kontras teks dan status memadai.

---

## 12. Acceptance Criteria Utama

### AC-01 — Otorisasi

**Given** seorang asisten hanya ditugaskan ke Kelompok A  
**When** asisten mencoba membuka data peserta Kelompok B melalui URL/API langsung  
**Then** server menolak akses dan tidak mengirim data peserta tersebut.

### AC-02 — Kontrol sesi

**Given** sesi Jurnal masih `waiting`  
**When** praktikan membuka workspace  
**Then** soal tidak dapat dikerjakan dan halaman menampilkan waiting state.

### AC-03 — Sinkronisasi realtime

**Given** praktikan berada pada waiting state  
**When** asisten membuka sesi Jurnal  
**Then** workspace berubah menjadi active tanpa reload manual.

### AC-04 — Draft jawaban

**Given** praktikan mengisi jawaban  
**When** Save Draft berhasil atau praktikan berpindah soal setelah menyimpan  
**Then** jawaban dapat dimuat kembali beserta Last Saved timestamp.

### AC-05 — Penutupan sesi

**Given** sesi telah ditutup  
**When** praktikan mengirim request perubahan atau submission  
**Then** server menolak request dan mempertahankan jawaban terakhir yang sah.

### AC-06 — Submission idempotent

**Given** praktikan menekan Submit dua kali karena jaringan lambat  
**When** kedua request diproses  
**Then** hanya satu submission final tercatat.

### AC-07 — Kode tidak dieksekusi

**Given** peserta menyimpan source code atau markup berbahaya  
**When** jawaban ditampilkan kembali  
**Then** konten ditampilkan sebagai teks dan tidak pernah dijalankan atau dirender sebagai script.

### AC-08 — Audit nilai

**Given** nilai peserta telah tersimpan  
**When** nilai diubah  
**Then** sistem mencatat nilai lama, nilai baru, aktor, dan timestamp.

### AC-09 — Deadline TP

**Given** deadline Tugas Pendahuluan telah lewat  
**When** peserta membuka halaman atau mengirim submission  
**Then** halaman read-only dan server menolak submission baru.

### AC-10 — Voting unik

**Given** peserta telah memilih satu asisten pada suatu kategori  
**When** peserta mencoba vote kembali pada kategori dan periode yang sama  
**Then** sistem menolak duplikasi.

---

## 13. Tahapan Implementasi

### Phase 1 — Discovery

- Audit repository, stack, struktur proyek, dan instruksi lokal.
- Periksa referensi desain.
- Dokumentasikan asumsi dan gap yang benar-benar blocking.
- Susun sitemap, matriks permission, schema, dan state transition.

### Phase 2 — Foundation

- Application shell dan design system.
- Authentication dan RBAC.
- Struktur semester, modul, kelas, kelompok, jadwal, dan assignment.
- Reusable form, table, status, modal, dan notification.

### Phase 3 — Core Practicum

- Soal Management.
- Practicum Workspace.
- Draft, submission, dan progress.
- Tugas Pendahuluan.
- Kontrol state sesi.

### Phase 4 — Operational Features

- Dashboard Asisten dan Praktikan.
- Monitoring realtime.
- Nilai dan audit history.
- Peserta, Asisten, dan State Management.

### Phase 5 — Supporting Features

- Announcement.
- Feedback dan Question thread.
- Voting.
- Report ringkas dan bulk import.

### Phase 6 — Hardening

- Responsive behavior dan accessibility.
- Empty/loading/error/offline states.
- Security dan permission tests.
- Realtime reconnect tests.
- Performance review dan visual QA.

---

## 14. Instruksi Eksekusi untuk AI Coding Agent

1. Baca repository dan instruksi proyek sebelum mengubah file.
2. Jangan mengasumsikan framework, package, atau struktur folder; deteksi dari repository.
3. Pertahankan pola arsitektur dan coding convention yang sudah digunakan.
4. Jangan langsung membangun seluruh fitur dalam satu perubahan besar. Kerjakan per phase atau vertical slice yang dapat diuji.
5. Untuk setiap fitur, implementasikan database, authorization, backend, frontend, validation, dan tests yang relevan.
6. Gunakan komponen reusable dan hindari duplikasi UI maupun business logic.
7. Jangan menambahkan code execution, terminal, runtime, output cell, atau integrasi notebook.
8. Jangan mengeksekusi konten pada field source code dalam kondisi apa pun.
9. Gunakan server sebagai source of truth untuk permission, deadline, state sesi, dan submission.
10. Jangan menghapus atau menimpa perubahan pengguna yang tidak berkaitan.
11. Jalankan formatter, static analysis, unit/integration test, dan build yang tersedia setelah implementasi.
12. Laporkan file yang diubah, migration yang ditambahkan, test yang dijalankan, hasil verifikasi, serta keterbatasan yang tersisa.

Jika terdapat keputusan yang berdampak besar dan tidak dapat ditentukan dari repository atau PRD—misalnya stack belum tersedia, metode autentikasi belum dipilih, atau formula nilai belum ditentukan—hentikan bagian terkait dan minta klarifikasi. Untuk detail kecil yang mudah dibalik, gunakan asumsi wajar dan dokumentasikan.

---

## 15. Definition of Done

Sebuah fitur dianggap selesai jika:

- Memenuhi functional requirement dan acceptance criteria terkait.
- Authorization server-side telah diterapkan.
- Validation dan error state tersedia.
- UI mengikuti design system dan responsif.
- Data migration/schema tersedia dan dapat dijalankan.
- Test utama lulus.
- Tidak memperkenalkan fitur code execution.
- Tidak merusak flow atau data yang sudah ada.
- Perubahan dan cara verifikasi didokumentasikan secara ringkas.

---

## 16. Keputusan yang Masih Perlu Dikonfirmasi

Hal berikut tidak boleh ditebak apabila belum tersedia di repository:

- Tech stack final dan versi framework.
- Metode login/registrasi serta identitas utama pengguna.
- Skala nilai dan formula bobot tiap sesi.
- Kebijakan late submission dan reopen submission.
- Batas ukuran serta tipe lampiran.
- Apakah feedback personal bersifat anonim.
- Format laporan praktikum dan export nilai.
- Durasi serta aturan timer tiap jenis sesi.

Keputusan tersebut dapat dikonfigurasi kemudian tanpa mengubah alur inti produk.
