import { useForm, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TeamInvitationAlert from '@/components/team-invitation-alert';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { TeamInvitationContext } from '@/types';

type Props = {
    status?: string;
    canResetPassword: boolean;
    teamInvitation?: TeamInvitationContext | null;
    login_type?: 'praktikan' | 'asisten';
};

export default function Login({
    status,
    canResetPassword,
    teamInvitation,
    login_type = 'praktikan',
}: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        identity_number: '',
        password: '',
        remember: false,
        login_type: login_type,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login', {
            onSuccess: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />

            {teamInvitation && (
                <TeamInvitationAlert
                    invitation={teamInvitation}
                    action="Log in"
                />
            )}

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="identity_number">
                            {login_type === 'asisten' ? 'Kode Asisten' : 'NIM'}
                        </Label>
                        <Input
                            id="identity_number"
                            type="text"
                            name="identity_number"
                            value={data.identity_number}
                            onChange={(e) => setData('identity_number', e.target.value)}
                            required
                            autoFocus
                            tabIndex={1}
                            placeholder={login_type === 'asisten' ? 'Masukkan kode asisten' : 'Masukkan NIM'}
                        />
                        <InputError message={errors.identity_number} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {/* Disabled password reset temporarily as route is hidden */}
                        </div>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked as boolean)}
                            tabIndex={3}
                        />
                        <Label htmlFor="remember">Remember me</Label>
                    </div>

                    <Button
                        type="submit"
                        className="mt-4 w-full"
                        tabIndex={4}
                        disabled={processing}
                        data-test="login-button"
                    >
                        {processing && <Spinner />}
                        Log in
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Don't have an account?{' '}
                    <TextLink
                        href={
                            (login_type === 'asisten' ? '/register/asisten' : '/register/praktikan') +
                            (teamInvitation ? `?invitation=${teamInvitation.code}` : '')
                        }
                        data-test="register-link"
                        tabIndex={5}
                    >
                        Sign up
                    </TextLink>
                </div>
            </form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your credentials below to log in',
};
