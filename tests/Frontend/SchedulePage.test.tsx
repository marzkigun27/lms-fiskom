import { afterEach, expect, spyOn, test } from 'bun:test';
const { Window } = await import(process.env.HAPPY_DOM_PATH ?? 'happy-dom');

const window = new Window({ url: 'http://localhost/asisten/jadwal' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLTitleElement', 'Element', 'Node', 'Event', 'CustomEvent', 'location', 'history', 'sessionStorage']) {
    Object.defineProperty(globalThis, key, { value: key === 'window' ? window : window[key], configurable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const { createInertiaApp, router } = await import('@inertiajs/react');
const { default: SchedulePage } = await import('../../resources/js/pages/Assistant/Schedule/Index');
let root;
afterEach(async () => { if (root) await act(async () => root.unmount()); document.body.innerHTML = ''; });

const participants = [1, 2, 3, 4].map(id => ({ id: id + 10, name: `Peserta ${id}`, nim: `NIM${id}` }));
const props = {
    schedules: [], assistants: [{ id: 7, name: 'Asisten Database' }], participants,
    semesters: [{ id: 12, name: 'Semester Test', is_active: true }],
    days: ['Senin', 'Sabtu', 'Minggu'], shifts: ['Shift 1 (06:30 - 09:30)'],
};
async function mount(data = props) {
    document.body.innerHTML = '<div id="app"></div>';
    await act(async () => {
        await createInertiaApp({ page: { component: 'Assistant/Schedule/Index', props: data, url: '/asisten/jadwal', version: 'test' },
            resolve: () => SchedulePage,
            setup({ el, App, props }) { root = createRoot(el); root.render(React.createElement(App, props)); },
        });
    });
}
async function click(text) {
    const button = [...document.querySelectorAll('button')].find(b => b.textContent.includes(text));
    expect(button).toBeDefined();
    await act(async () => button.click());
}
async function select(label, value) {
    const element = document.querySelector(`select[aria-label="${label}"]`);
    expect(element).not.toBeNull();
    await act(async () => { element.value = String(value); element.dispatchEvent(new window.Event('change', { bubbles: true })); });
}

test('creates a schedule from database choices, shows server errors, and retains selections', async () => {
    const post = spyOn(router, 'post').mockImplementation((_url, _payload, options) => {
        options.onError({ 'groups.0.participant_ids': 'Pilih minimal 3 praktikan.' }); options.onFinish();
    });
    try {
        await mount();
        expect(document.body.textContent).toContain('Belum ada jadwal pada semester ini');
        await click('Tambah Jadwal');
        await select('Tambah Asisten', 7);
        await select('Tambah Praktikan Kelompok 1', 11);
        await click('Simpan Jadwal');
        expect(post.mock.calls[0][0]).toBe('/asisten/jadwal');
        expect(post.mock.calls[0][1]).toEqual({ semester_id: 12, day: 'Senin', shift: props.shifts[0], assistant_ids: [7], groups: [{ number: 1, participant_ids: [11] }] });
        expect(document.querySelector('[role="alert"]').textContent).toContain('Pilih minimal 3 praktikan.');
        expect(document.body.textContent).toContain('Peserta 1');
    } finally { post.mockRestore(); }
});

test('loads weekend schedules for editing and sends PUT with persisted group numbers', async () => {
    const put = spyOn(router, 'put').mockImplementation((_url, _payload, options) => { options.onSuccess(); options.onFinish(); });
    try {
        await mount({ ...props, schedules: [{ id: 90, semester_id: 12, day: 'Minggu', shift: props.shifts[0], assistants: props.assistants, groups: [{ id: 88, number: 1, members: participants.slice(0, 3) }] }] });
        expect(document.body.textContent).toContain('Minggu');
        await act(async () => document.querySelector('button[title="Edit"]').click());
        expect(document.body.textContent).toContain('Edit Jadwal');
        expect(document.body.textContent).toContain('Kelompok 1');
        await click('Simpan Jadwal');
        expect(put.mock.calls[0][0]).toBe('/asisten/jadwal/90');
        expect(put.mock.calls[0][1].groups).toEqual([{ number: 1, participant_ids: [11, 12, 13] }]);
        expect(document.body.textContent).toContain('Jadwal berhasil disimpan.');
    } finally { put.mockRestore(); }
});

test('deletes only after confirmation', async () => {
    const remove = spyOn(router, 'delete').mockImplementation((_url, options) => { options.onSuccess(); options.onFinish(); });
    const originalConfirm = window.confirm;
    let confirmed = false;
    Object.defineProperty(window, 'confirm', { configurable: true, value: () => confirmed });
    try {
        await mount({ ...props, schedules: [{ id: 90, semester_id: 12, day: 'Senin', shift: props.shifts[0], assistants: [], groups: [] }] });
        await act(async () => document.querySelector('button[title="Hapus"]').click());
        expect(remove).not.toHaveBeenCalled();
        confirmed = true;
        await act(async () => document.querySelector('button[title="Hapus"]').click());
        expect(remove.mock.calls[0][0]).toBe('/asisten/jadwal/90');
        expect(document.body.textContent).toContain('Jadwal berhasil dihapus.');
    } finally { remove.mockRestore(); Object.defineProperty(window, 'confirm', { configurable: true, value: originalConfirm }); }
});

test('semester selector requests the chosen semester from the server', async () => {
    const get = spyOn(router, 'get').mockImplementation(() => {});
    try {
        await mount({ ...props, selectedSemesterId: 13, semesters: [...props.semesters, { id: 13, name: 'Semester lain', is_active: false }] });
        const selector = document.querySelector('#schedule-semester');
        expect(selector.value).toBe('13');
        await act(async () => { selector.value = '12'; selector.dispatchEvent(new window.Event('change', { bubbles: true })); });
        expect(get.mock.calls[0][0]).toBe('/asisten/jadwal');
        expect(get.mock.calls[0][1]).toEqual({ semester_id: 12 });
    } finally { get.mockRestore(); }
});

test('prevents selecting a participant twice across groups and supports removal', async () => {
    await mount();
    await click('Tambah Jadwal');
    await select('Tambah Praktikan Kelompok 1', 11);
    const counts = [...document.querySelectorAll('select')].find(s => s.options.length === 5 && s.options[0].value === '1');
    await act(async () => { counts.value = '2'; counts.dispatchEvent(new window.Event('change', { bubbles: true })); });
    expect([...document.querySelector('select[aria-label="Tambah Praktikan Kelompok 2"]').options].map(o => o.value)).not.toContain('11');
    await act(async () => document.querySelector('button[aria-label="Hapus praktikan Peserta 1"]').click());
    expect([...document.querySelector('select[aria-label="Tambah Praktikan Kelompok 2"]').options].map(o => o.value)).toContain('11');
});
