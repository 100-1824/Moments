<?php

declare(strict_types=1);

namespace App\Http\Requests;

use DateTimeZone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:1', 'max:80'],
            'email' => ['required', 'email', 'max:255'],
            'timezone' => ['required', 'string', 'max:64', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! in_array($value, DateTimeZone::listIdentifiers(), true)) {
                    $fail('The :attribute must be a valid IANA timezone identifier.');
                }
            }],
        ];
    }
}
