import { useForm, Head, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TeamInvitationAlert from '@/components/team-invitation-alert';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { TeamInvitationContext } from '@/types';

type Props = {
    passwordRules: string;
    teamInvitation?: TeamInvitationContext | null;
    register_type?: 'praktikan' | 'asisten';
};

export default function Register({ passwordRules, teamInvitation, register_type = 'praktikan' }: Props) {
    const page = usePage();
    const registration = (page.props as any).registration;
    const participantRegistration = registration?.participant;
    const assistantRegistration = registration?.assistant;

    const isBlocked = register_type === 'asisten'
        ? (assistantRegistration ? !assistantRegistration.is_allowed : false)
        : (participantRegistration ? !participantRegistration.is_allowed : (registration && !registration.is_allowed));

    const classes = registration?.options?.classes || [];
    const shifts = registration?.options?.shifts || [];

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        identity_number: '',
        password: '',
        password_confirmation: '',
        register_type: register_type,
        class_id: '',
        weekly_schedule_id: '',
        group_number: '',
    });

    const selectedShift = shifts.find((s: any) => String(s.id) === String(data.weekly_schedule_id));
    const availableGroups = selectedShift?.groups || [];

    const handleShiftChange = (shiftId: string) => {
        setData((prev) => ({
            ...prev,
            weekly_schedule_id: shiftId,
            group_number: '',
        }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register', {
            onSuccess: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register" />
            
            {teamInvitation && (
                <TeamInvitationAlert
                    invitation={teamInvitation}
                    action="Register"
                />
            )}

            {isBlocked ? (
                <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-5 text-center text-destructive space-y-2">
                    <p className="font-bold text-base">
                        Registrasi {register_type === 'asisten' ? 'Asisten' : 'Praktikan'} Ditutup
                    </p>
                    <p className="text-sm">
                        {register_type === 'asisten'
                            ? 'Pendaftaran akun asisten laboratorium saat ini sedang dinonaktifkan.'
                            : 'Pendaftaran akun praktikan saat ini sedang dinonaktifkan oleh pengelola laboratorium.'}
                    </p>
                </div>
            ) : (
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Full name"
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="email@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="identity_number">
                                {register_type === 'asisten' ? 'Kode Asisten' : 'NIM'}
                            </Label>
                            <Input
                                id="identity_number"
                                type="text"
                                required
                                tabIndex={3}
                                name="identity_number"
                                value={data.identity_number}
                                onChange={(e) => setData('identity_number', e.target.value)}
                                placeholder={register_type === 'asisten' ? 'Masukkan kode asisten' : 'Masukkan NIM'}
                            />
                            <InputError message={errors.identity_number} />
                        </div>

                        {register_type === 'praktikan' && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="class_id">Kelas Praktikum</Label>
                                    <select
                                        id="class_id"
                                        required
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        value={data.class_id}
                                        onChange={(e) => setData('class_id', e.target.value)}
                                    >
                                        <option value="">-- Pilih Kelas --</option>
                                        {classes.map((c: any) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.class_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="weekly_schedule_id">Shift Praktikum</Label>
                                    <select
                                        id="weekly_schedule_id"
                                        required
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        value={data.weekly_schedule_id}
                                        onChange={(e) => handleShiftChange(e.target.value)}
                                    >
                                        <option value="">-- Pilih Shift Praktikum --</option>
                                        {shifts.map((s: any) => (
                                            <option key={s.id} value={s.id}>
                                                {s.label || (s.day && s.shift ? `${s.day} - ${s.shift}` : `${s.name || 'Shift'} (${s.day_of_week || '-'}, ${s.formatted_time || '-'})`)}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.weekly_schedule_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="group_number">Kode Kelompok</Label>
                                    <select
                                        id="group_number"
                                        required
                                        disabled={!data.weekly_schedule_id}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        value={data.group_number}
                                        onChange={(e) => setData('group_number', e.target.value)}
                                    >
                                        <option value="">
                                            {!data.weekly_schedule_id ? '-- Pilih Shift Terlebih Dahulu --' : '-- Pilih Kelompok --'}
                                        </option>
                                        {availableGroups.map((g: any) => (
                                            <option key={g.number} value={g.number}>
                                                {g.code ? `${g.code} (Kelompok ${g.number})` : `Kelompok ${g.number}`}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.group_number} />
                                </div>
                            </>
                        )}

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                            passwordrules={passwordRules}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            required
                            tabIndex={5}
                            autoComplete="new-password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirm password"
                            passwordrules={passwordRules}
                        />
                        <InputError
                            message={errors.password_confirmation}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        tabIndex={6}
                        disabled={processing}
                        data-test="register-user-button"
                    >
                        {processing && <Spinner />}
                        Create account
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Already have an account?{' '}
                    <TextLink
                        href={
                            (register_type === 'asisten' ? '/login/asisten' : '/login/praktikan') +
                            (teamInvitation ? `?invitation=${teamInvitation.code}` : '')
                        }
                        data-test="team-invitation-login-link"
                        tabIndex={7}
                    >
                        Log in
                    </TextLink>
                </div>
            </form>
            )}
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
