<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Support\InviteCode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'        => fake()->firstName(),
            'phone'       => fake()->unique()->e164PhoneNumber(),
            'invite_code' => InviteCode::generateUnique(),
            'timezone'    => fake()->timezone(),
        ];
    }
}
