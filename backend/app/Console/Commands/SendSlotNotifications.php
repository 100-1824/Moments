<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use NotificationChannels\WebPush\WebPushMessage;

class SendSlotNotifications extends Command
{
    protected $signature = 'notifications:send-slot-reminders';

    protected $description = 'Send push notifications for slot boundaries (morning, evening, night)';

    public function handle(): int
    {
        $users = User::whereHas('pushSubscriptions')
            ->with('pushSubscriptions')
            ->get();

        if ($users->isEmpty()) {
            $this->info('No users with push subscriptions');
            return 0;
        }

        $now = now();
        $hour = $now->hour;
        $minute = $now->minute;

        // Define slot boundaries and notification messages
        $slotNotifications = [
            // Morning: 5am-12pm
            ['start' => [5, 0], 'end' => [12, 0], 'name' => 'morning', 'emoji' => '🌅', 'messages' => [
                'start' => 'Good morning! ☀️ Time to share a moment from your morning.',
                'mid' => 'Mid-morning check-in! ✨ Capture your favorite moment so far.',
                'end' => 'Morning wrapping up! 🌤️ Last chance for a morning moment today.',
            ]],
            // Evening: 12pm-6pm
            ['start' => [12, 0], 'end' => [18, 0], 'name' => 'evening', 'emoji' => '🌆', 'messages' => [
                'start' => 'Good afternoon! 😎 Time to share an evening moment.',
                'mid' => 'Afternoon vibes! 🎶 Share what you\'re up to.',
                'end' => 'Evening coming soon! 🌅 Last chance for an afternoon moment.',
            ]],
            // Night: 6pm-5am (next day)
            ['start' => [18, 0], 'end' => [5, 0], 'name' => 'night', 'emoji' => '🌙', 'messages' => [
                'start' => 'Good evening! 🌙 Time to wind down and share a moment.',
                'mid' => 'Night time! ⭐ Share what your evening looks like.',
                'end' => 'Night wrapping up! 💤 Last chance for a night moment.',
            ]],
        ];

        $notificationsSent = 0;

        foreach ($users as $user) {
            foreach ($slotNotifications as $slot) {
                $message = $this->getSlotMessage($hour, $minute, $slot);

                if ($message) {
                    foreach ($user->pushSubscriptions as $subscription) {
                        try {
                            $this->info("Would send to user {$user->id}: {$slot['name']} - {$message}");
                            $notificationsSent++;
                        } catch (\Exception $e) {
                            $this->warn("Failed to send notification to user {$user->id}: {$e->getMessage()}");
                        }
                    }
                }
            }
        }

        $this->info("Checked $notificationsSent potential notifications");
        return 0;
    }

    /**
     * Determine which message to send based on current time and slot.
     * Messages are sent at: start (5min window), mid (±15min), end (5min window)
     */
    private function getSlotMessage(int $hour, int $minute, array $slot): ?string
    {
        [$startHour, $startMin] = $slot['start'];
        [$endHour, $endMin] = $slot['end'];

        // Check if we're in a start window (5 minutes after start)
        if ($this->isInTimeWindow($hour, $minute, $startHour, $startMin, 5)) {
            return $slot['messages']['start'];
        }

        // Calculate midpoint
        $startMinutes = $startHour * 60 + $startMin;
        $endMinutes = $endHour * 60 + $endMin;

        // Handle night slot wrapping (6pm to 5am next day)
        if ($slot['name'] === 'night' && $endHour < $startHour) {
            if ($hour >= $startHour) {
                $endMinutes += 24 * 60;
            }
        }

        $midMinutes = ($startMinutes + $endMinutes) / 2;
        $midHour = (int)($midMinutes / 60) % 24;
        $midMin = (int)($midMinutes % 60);

        // Check if we're at midpoint (±15 minutes)
        if ($this->isInTimeWindow($hour, $minute, $midHour, $midMin, 15)) {
            return $slot['messages']['mid'];
        }

        // Check if we're in end window (5 minutes before end)
        if ($this->isInTimeWindow($hour, $minute, $endHour, $endMin, -5)) {
            return $slot['messages']['end'];
        }

        return null;
    }

    /**
     * Check if current time is within a window of the specified time.
     * Window is in minutes (negative = before, positive = after).
     */
    private function isInTimeWindow(int $hour, int $minute, int $targetHour, int $targetMin, int $windowMinutes): bool
    {
        $currentMinutes = $hour * 60 + $minute;
        $targetMinutes = $targetHour * 60 + $targetMin;

        $tolerance = abs($windowMinutes);
        $minWindow = $targetMinutes - $tolerance;
        $maxWindow = $targetMinutes + $tolerance;

        return $currentMinutes >= $minWindow && $currentMinutes <= $maxWindow;
    }
}
