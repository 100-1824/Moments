<x-mail::message>
# Verification Code

Use the code below to sign in to your Moments account. This code will expire in 10 minutes.

<x-mail::panel>
## {{ $otp }}
</x-mail::panel>

If you didn't request this code, you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
