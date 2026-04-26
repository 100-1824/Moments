<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class PingNotification extends Notification
{
    use Queueable;

    public function __construct(protected User $sender) {}

    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $name = $this->sender->partner_nickname ?? $this->sender->name;

        return WebPushMessage::create()
            ->title($name . ' is thinking of you 💗')
            ->body('Hold to feel it back')
            ->tag('ping')
            ->data(['type' => 'ping', 'url' => '/']);
    }
}
