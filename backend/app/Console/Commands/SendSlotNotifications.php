<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\SlotReminderNotification;
use Illuminate\Console\Command;

class SendSlotNotifications extends Command
{
    protected $signature = 'notifications:send-slot-reminders';

    protected $description = 'Send push notifications for slot boundaries (morning, evening, night)';

    public function handle(): int
    {
        if (! filled(config('webpush.vapid.public_key')) || ! filled(config('webpush.vapid.private_key'))) {
            $this->warn('VAPID keys are missing. Slot reminders were skipped.');
            return 0;
        }

        $users = User::whereHas('pushSubscriptions')
            ->get();

        if ($users->isEmpty()) {
            $this->info('No users with push subscriptions');
            return 0;
        }

        $notificationsSent = 0;

        foreach ($users as $user) {
            $now = now($user->timezone ?: 'UTC');
            $reminder = $this->getSlotReminder($now->hour, $now->minute);

            if (! $reminder) {
                continue;
            }

            [$slot, $phase, $emoji, $message] = $reminder;
            $user->notify(new SlotReminderNotification($slot, $phase, $emoji, $message));
            $notificationsSent++;
        }

        $this->info("Sent {$notificationsSent} slot reminder notification(s).");
        return 0;
    }

    /**
     * Determine which reminder should be sent at the exact current minute.
     *
     * @return array{0: string, 1: string, 2: string, 3: string}|null
     */
    private function getSlotReminder(int $hour, int $minute): ?array
    {
        $currentMinute = $hour * 60 + $minute;
        $schedules = [
            'morning' => [
                'emoji' => '🌅',
                'start' => [5, 0],
                'end' => [12, 0],
                'messages' => [
                    'start' => 'Good morning! ☀️ Time to share a morning moment.',
                    'mid' => 'Mid-morning check-in! ✨ Capture your favorite moment so far.',
                    'end' => 'Morning wrapping up! 🌤️ Last chance for a morning moment.',
                ],
            ],
            'evening' => [
                'emoji' => '🌆',
                'start' => [12, 0],
                'end' => [18, 0],
                'messages' => [
                    'start' => 'Good afternoon! 😎 Time to share an evening moment.',
                    'mid' => 'Afternoon vibes! 🎶 Share what you are up to.',
                    'end' => 'Evening is coming soon! 🌇 Last chance for an evening moment.',
                ],
            ],
            'night' => [
                'emoji' => '🌙',
                'start' => [18, 0],
                'end' => [5, 0],
                'messages' => [
                    'start' => 'Good evening! 🌙 Time to wind down and share a moment.',
                    'mid' => 'Night check-in! ⭐ Share what your evening looks like.',
                    'end' => 'Night is wrapping up! 💤 Last chance for a night moment.',
                ],
            ],
        ];

        foreach ($schedules as $slot => $schedule) {
            $startMinute = ($schedule['start'][0] * 60) + $schedule['start'][1];
            $endMinute = ($schedule['end'][0] * 60) + $schedule['end'][1];
            $duration = $endMinute >= $startMinute
                ? $endMinute - $startMinute
                : (24 * 60 - $startMinute) + $endMinute;

            $midMinute = ($startMinute + intdiv($duration, 2)) % (24 * 60);
            $endReminderMinute = ($endMinute - 5 + (24 * 60)) % (24 * 60);

            if ($currentMinute === $startMinute) {
                return [$slot, 'start', $schedule['emoji'], $schedule['messages']['start']];
            }

            if ($currentMinute === $midMinute) {
                return [$slot, 'mid', $schedule['emoji'], $schedule['messages']['mid']];
            }

            if ($currentMinute === $endReminderMinute) {
                return [$slot, 'end', $schedule['emoji'], $schedule['messages']['end']];
            }
        }

        return null;
    }
}
