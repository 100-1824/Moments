<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class SlotReminderNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $slot,
        private readonly string $phase,
        private readonly string $emoji,
        private readonly string $message
    ) {
    }

    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $slotLabel = ucfirst($this->slot);

        return WebPushMessage::create()
            ->title("{$this->emoji} {$slotLabel} Reminder")
            ->body($this->message)
            ->action('Open Moments', '/')
            ->badge('/badge-72x72.png')
            ->tag("slot-reminder-{$this->slot}-{$this->phase}")
            ->data([
                'url' => '/',
                'tag' => "slot-reminder-{$this->slot}-{$this->phase}",
                'slot' => $this->slot,
                'phase' => $this->phase,
            ]);
    }
}
