<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class MomentReceivedNotification extends Notification
{
    use Queueable;

    protected User $sender;
    protected int $momentCount;
    protected ?string $previewImageUrl;
    protected ?string $slot;

    public function __construct(
        User $sender,
        int $momentCount = 1,
        ?string $previewImageUrl = null,
        ?string $slot = null
    )
    {
        $this->sender = $sender;
        $this->momentCount = max(1, $momentCount);
        $this->previewImageUrl = $previewImageUrl;
        $this->slot = $slot;
    }

    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush(object $notifiable): WebPushMessage
    {
        $senderName = $this->sender->partner_nickname ?? $this->sender->name;
        $slotLabel = $this->slot ? ucfirst($this->slot) : 'new';
        $body = $this->momentCount === 1
            ? "Your partner shared a {$slotLabel} moment with you"
            : "Your partner shared {$this->momentCount} new moments with you";

        $message = WebPushMessage::create()
            ->title('New Moment from ' . $senderName . ' 💖')
            ->body($body)
            ->action('Open', '/')
            ->badge('/badge-72x72.png')
            ->tag('moment-received')
            ->data([
                'url' => '/',
                'tag' => 'moment-received',
                'moment_count' => $this->momentCount,
                'slot' => $this->slot,
            ]);

        if ($this->previewImageUrl) {
            $message->image($this->previewImageUrl);
        }

        return $message;
    }
}
