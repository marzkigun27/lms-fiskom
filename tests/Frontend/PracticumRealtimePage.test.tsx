import { afterEach, expect, mock, spyOn, test } from 'bun:test';
const { Window } = await import(process.env.HAPPY_DOM_PATH ?? 'happy-dom');

const window = new Window({ url: 'http://localhost/praktikan/praktikum' });
for (const key of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'HTMLTitleElement',
    'Element',
    'Node',
    'Event',
    'CustomEvent',
    'location',
    'history',
    'sessionStorage',
]) {
    Object.defineProperty(globalThis, key, {
        value: key === 'window' ? window : window[key],
        configurable: true,
    });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);

const privateListeners = [];
const presenceListeners = [];
mock.module('@laravel/echo-react', () => ({
    useConnectionStatus: () => 'connected',
    useEcho: (channel, event, callback) => {
        privateListeners.push({ channel, event, callback });
        return { channel: () => ({}) };
    },
    useEchoPresence: (channel, event, callback) => {
        presenceListeners.push({ channel, event, callback });
        return {
            channel: () => ({
                here: () => ({ joining: () => ({ leaving: () => ({}) }) }),
            }),
        };
    },
}));

const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const { createInertiaApp, router } = await import('@inertiajs/react');
const { default: WorkspaceIndex } =
    await import('../../resources/js/pages/Participant/Workspace/Index');
const { default: WorkspaceShow } =
    await import('../../resources/js/pages/Participant/Workspace/Show');
let root;

afterEach(async () => {
    if (root) await act(async () => root.unmount());
    root = undefined;
    document.body.innerHTML = '';
    privateListeners.length = 0;
    presenceListeners.length = 0;
});

async function mount(component, props, url = '/praktikan/praktikum') {
    document.body.innerHTML = '<div id="app"></div>';
    await act(async () => {
        await createInertiaApp({
            page: { component: 'Test', props, url, version: 'test' },
            resolve: () => component,
            setup({ el, App, props: inertiaProps }) {
                root = createRoot(el);
                root.render(React.createElement(App, inertiaProps));
            },
        });
    });
}

const session = {
    id: 10,
    session_type: 'initial_task',
    state: 'active',
    practicum_schedule: {
        module: { title: 'Pengantar Sinyal', questions: [] },
    },
};

test('participant lobby reloads active sessions from its scoped control channel', async () => {
    const reload = spyOn(router, 'reload').mockImplementation(() => {});
    try {
        await mount(WorkspaceIndex, {
            activeSessions: [],
            controlChannels: [44],
        });

        const listener = privateListeners.find(
            (item) => item.channel === 'practicum-control.44',
        );
        expect(listener).toBeDefined();
        expect(listener.event).toBe('.SessionStateUpdated');
        await act(async () =>
            listener.callback({
                action: 'started',
                session: { id: 10, state: 'active' },
            }),
        );
        expect(reload).toHaveBeenCalledWith({ only: ['activeSessions'] });
        expect(document.body.textContent).toContain('Realtime terhubung');
    } finally {
        reload.mockRestore();
    }
});

test('participant workspace follows phase changes and returns to lobby when ended', async () => {
    const visit = spyOn(router, 'visit').mockImplementation(() => {});
    try {
        await mount(
            WorkspaceShow,
            { session, existingAnswers: {} },
            '/praktikan/praktikum/10',
        );

        const listener = presenceListeners.find(
            (item) =>
                item.channel === 'practicum.10' &&
                item.event === '.SessionStateUpdated',
        );
        expect(listener).toBeDefined();

        await act(async () =>
            listener.callback({
                action: 'phase_changed',
                session: { id: 11, state: 'active', session_type: 'journal' },
            }),
        );
        expect(visit).toHaveBeenCalledWith('/praktikan/praktikum/11');

        await act(async () =>
            listener.callback({
                action: 'ended',
                session: {
                    id: 11,
                    state: 'completed',
                    session_type: 'journal',
                },
            }),
        );
        expect(visit).toHaveBeenCalledWith('/praktikan/praktikum');
    } finally {
        visit.mockRestore();
    }
});
