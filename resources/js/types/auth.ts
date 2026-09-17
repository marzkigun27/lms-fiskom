export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    identity_number?: string;
    user_type: 'assistant' | 'participant';
    status: 'pending' | 'active' | 'inactive' | 'suspended';
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
