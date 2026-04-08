<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncMomentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->couple_id !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'moments' => ['required', 'array', 'min:1', 'max:10'],
            'moments.*.media' => ['required', 'file', 'max:25600'],
            'moments.*.type' => ['required', 'in:image,audio'],
            'moments.*.caption_payload' => ['nullable', 'string'],
            'moments.*.is_encrypted' => ['sometimes', 'boolean'],
            'moments.*.client_id' => ['required', 'string', 'max:64'],
            'moments.*.captured_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
