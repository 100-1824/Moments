<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;

/**
 * Generates the human-friendly invite code partners exchange in person.
 *
 * Format: MOM-XXX where XXX is a base36-ish 3-character group derived from
 * cryptographically secure random bytes. We retry on collision against the
 * `users.invite_code` unique index.
 */
final class InviteCode
{
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public static function generateUnique(int $maxAttempts = 12): string
    {
        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            $code = self::randomCode();

            if (! User::query()->where('invite_code', $code)->exists()) {
                return $code;
            }
        }

        throw new \RuntimeException('Unable to allocate a unique invite code.');
    }

    private static function randomCode(): string
    {
        $alphabet = self::ALPHABET;
        $length = strlen($alphabet);
        $chars = '';

        for ($i = 0; $i < 3; $i++) {
            $chars .= $alphabet[random_int(0, $length - 1)];
        }

        return 'MOM-' . $chars;
    }
}
