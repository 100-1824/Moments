<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConnectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'partner_invite_code' => ['required', 'string', 'min:6', 'max:16'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('partner_invite_code')) {
            $this->merge([
                'partner_invite_code' => strtoupper(trim((string) $this->input('partner_invite_code'))),
            ]);
        }
    }
}
