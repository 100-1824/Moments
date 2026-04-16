<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class MomentReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected User $sender;

    public function __construct(User $sender)
    {
        $this->sender = $sender;
    }

    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $senderName = $this->sender->partner_nickname ?? $this->sender->name;

        return WebPushMessage::create()
            ->title('New Moment from ' . $senderName . ' 💖')
            ->body('Your partner just shared a moment with you')
            ->action('Open', '/')
            ->badge('/badge-72x72.png')
            ->data([
                'url' => '/',
                'tag' => 'moment-received',
            ]);
    }
}
