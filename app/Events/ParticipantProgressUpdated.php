<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParticipantProgressUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $sessionId;

    public int $participantId;

    public string $status;

    public array $progress; // e.g. ['completed' => 5, 'total' => 10]

    /**
     * Create a new event instance.
     */
    public function __construct(int $sessionId, int $participantId, string $status, array $progress = [])
    {
        $this->sessionId = $sessionId;
        $this->participantId = $participantId;
        $this->status = $status;
        $this->progress = $progress;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('practicum.'.$this->sessionId),
        ];
    }
}
