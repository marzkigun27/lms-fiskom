<?php

namespace App\Events;

use App\Models\PracticumSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SessionStateUpdated implements ShouldBroadcastNow, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public PracticumSession $session,
        public string $action,
        public ?int $previousSessionId = null,
    ) {
        $this->session->loadMissing('practicumSchedule');
    }

    /** @return array<int, Channel> */
    public function broadcastOn(): array
    {
        $channels = [
            new PresenceChannel('practicum.'.($this->previousSessionId ?? $this->session->id)),
        ];

        $weeklyScheduleId = $this->session->practicumSchedule->weekly_schedule_id;

        if ($weeklyScheduleId !== null) {
            $channels[] = new PrivateChannel('practicum-control.'.$weeklyScheduleId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'SessionStateUpdated';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'previous_session_id' => $this->previousSessionId,
            'session' => [
                'id' => $this->session->id,
                'practicum_schedule_id' => $this->session->practicum_schedule_id,
                'session_type' => $this->session->session_type,
                'state' => $this->session->state,
                'opened_at' => $this->session->opened_at?->toISOString(),
                'closed_at' => $this->session->closed_at?->toISOString(),
                'completed_at' => $this->session->completed_at?->toISOString(),
            ],
        ];
    }
}
