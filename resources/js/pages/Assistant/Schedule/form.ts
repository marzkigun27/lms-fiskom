export type Assistant = { id: number; name: string; avatar?: string };
export type Participant = { id: number; name: string; nim: string | null };
export type ScheduleGroup = { id: number; number: number; members: Participant[] };
export type Schedule = {
    id: number;
    semester_id: number;
    day: string;
    shift: string;
    assistants: Assistant[];
    groups: ScheduleGroup[];
};

export function schedulePayload(input: {
    semesterId: string;
    day: string;
    shift: string;
    assistants: Assistant[];
    groups: ScheduleGroup[];
}) {
    return {
        semester_id: Number(input.semesterId),
        day: input.day,
        shift: input.shift,
        assistant_ids: input.assistants.map(({ id }) => id),
        groups: input.groups.map(({ number, members }) => ({
            number,
            participant_ids: members.map(({ id }) => id),
        })),
    };
}
