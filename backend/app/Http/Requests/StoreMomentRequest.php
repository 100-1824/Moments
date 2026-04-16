<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMomentRequest extends FormRequest
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
        $isEncrypted = $this->boolean('is_encrypted');

        return [
            'media' => ['required', 'file', 'max:25600', 'mimes:jpeg,jpg,png,gif,webp,heic,heif,mp3,m4a,ogg,aac,wav,opus'], // up to 25 MB
            'type' => ['required', 'in:image,audio'],
            // When the payload is end-to-end encrypted we treat it as
            // an opaque ciphertext blob and skip length validation.
            'caption_payload' => $isEncrypted
                ? ['nullable', 'string']
                : ['nullable', 'string', 'max:2000'],
            'is_encrypted' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_encrypted')) {
            $this->merge([
                'is_encrypted' => filter_var(
                    $this->input('is_encrypted'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ) ?? false,
            ]);
        }
    }
}
