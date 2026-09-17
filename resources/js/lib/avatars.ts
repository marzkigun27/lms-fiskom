export interface AvatarItem {
    id: string;
    url: string;
    label: string;
    description: string;
    category: 'hijab' | 'female' | 'male';
}

export const AVATAR_CATEGORIES = [
    { key: 'all', label: 'Semua', count: 15 },
    { key: 'hijab', label: 'Berhijab', count: 5 },
    { key: 'female', label: 'Wanita', count: 5 },
    { key: 'male', label: 'Pria', count: 5 },
] as const;

export type AvatarCategoryKey = typeof AVATAR_CATEGORIES[number]['key'];

export const AVATAR_LIST: AvatarItem[] = [
    // 5 Wanita Berhijab
    {
        id: 'hijab-pink',
        url: 'https://api.dicebear.com/7.x/open-peeps/svg?head=hijab&face=smile&backgroundColor=fdbec9',
        label: 'Hijab Pink (Ramah)',
        description: 'Berhijab senyum hangat santai',
        category: 'hijab',
    },
    {
        id: 'hijab-glasses',
        url: 'https://api.dicebear.com/7.x/open-peeps/svg?head=hijab&face=calm&accessories=glasses&backgroundColor=b2f2bb',
        label: 'Hijab Kacamata (Fokus)',
        description: 'Berhijab kacamata cerdas tekun',
        category: 'hijab',
    },
    {
        id: 'hijab-blue',
        url: 'https://api.dicebear.com/7.x/open-peeps/svg?head=hijab&face=cute&backgroundColor=afc8f0',
        label: 'Hijab Biru (Ceria)',
        description: 'Berhijab ceria dan bersahabat',
        category: 'hijab',
    },
    {
        id: 'hijab-peach',
        url: 'https://api.dicebear.com/7.x/open-peeps/svg?head=hijab&face=smileBig&backgroundColor=fce4b3',
        label: 'Hijab Peach (Antusias)',
        description: 'Berhijab senyum gembira antusias',
        category: 'hijab',
    },
    {
        id: 'hijab-lavender',
        url: 'https://api.dicebear.com/7.x/open-peeps/svg?head=hijab&face=driven&backgroundColor=e8d5ff',
        label: 'Hijab Ungu (Dinamis)',
        description: 'Berhijab ekspresi dinamis dan percaya diri',
        category: 'hijab',
    },

    // 5 Wanita
    {
        id: 'diana',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Diana&backgroundColor=b2f2bb',
        label: 'Diana (Mint)',
        description: 'Wanita kasual rambut pendek',
        category: 'female',
    },
    {
        id: 'siti',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Siti&backgroundColor=fdbec9',
        label: 'Siti (Pink)',
        description: 'Wanita anggun rambut panjang',
        category: 'female',
    },
    {
        id: 'maya',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Maya&backgroundColor=f8f9fa',
        label: 'Maya (Netral)',
        description: 'Wanita gaya bob modern',
        category: 'female',
    },
    {
        id: 'sarah',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=fce4b3',
        label: 'Sarah (Peach)',
        description: 'Wanita rambut ikal berkacamata',
        category: 'female',
    },
    {
        id: 'farah',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Farah&backgroundColor=e8d5ff',
        label: 'Farah (Ungu)',
        description: 'Wanita gaya ponytail dinamis',
        category: 'female',
    },

    // 5 Pria
    {
        id: 'budi',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Budi&backgroundColor=fce4b3',
        label: 'Budi (Peach)',
        description: 'Pria hangat dan ramah',
        category: 'male',
    },
    {
        id: 'anton',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Anton&backgroundColor=afc8f0',
        label: 'Anton (Biru)',
        description: 'Pria kasual rambut rapi',
        category: 'male',
    },
    {
        id: 'reza',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Reza&backgroundColor=d4e3ff',
        label: 'Reza (Kacamata)',
        description: 'Pria tekun berkacamata',
        category: 'male',
    },
    {
        id: 'felix',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=ffd8be',
        label: 'Felix (Aprikot)',
        description: 'Pria gaya rambut ikal bergelombang',
        category: 'male',
    },
    {
        id: 'ahmad',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ahmad&backgroundColor=b2f2bb',
        label: 'Ahmad (Mint)',
        description: 'Pria smart dan teratur',
        category: 'male',
    },
];

export const AVAILABLE_AVATARS: string[] = AVATAR_LIST.map((item) => item.url);
