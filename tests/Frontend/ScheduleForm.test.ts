import { expect, test } from 'bun:test';
import { schedulePayload } from '../../resources/js/pages/Assistant/Schedule/form';

test('serializes selected real users and group numbers into the backend contract', () => {
    const input = {
        semesterId: '12', day: 'Minggu', shift: 'Shift 2 (09:30 - 12:30)',
        assistants: [{ id: 7, name: 'Asisten' }],
        groups: [{ id: 42, number: 2, members: [{ id: 18, name: 'Praktikan', nim: '123' }] }],
    };
    expect(schedulePayload(input)).toEqual({
        semester_id: 12, day: input.day, shift: input.shift,
        assistant_ids: [7], groups: [{ number: 2, participant_ids: [18] }],
    });
    expect(input.groups[0].id).toBe(42);
});
