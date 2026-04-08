# Production Database Setup - Using Migration Endpoint

## Problem
Your production PostgreSQL database exists but has no tables. The `/api/auth/register` endpoint fails with `500` because Laravel queries fail.

## Solution
Use the protected migration endpoint to set up your production database.

### Step 1: Add Migration Token to Vercel

In Vercel project settings (Environment Variables), add:

```
MIGRATION_TOKEN=your-secure-random-token-here
```

**Generate a secure token:**
```bash
openssl rand -hex 32
# Example: a7f3b8e2c1d9f4a6b5e8c2d1f9a3b8e7
```

### Step 2: Call the Migration Endpoint

After redeployment, run migrations:

```bash
curl -X POST 'https://moments-us-app.vercel.app/api/migrate?token=YOUR_TOKEN_FROM_STEP_1'
```

Replace `YOUR_TOKEN_FROM_STEP_1` with the actual token you set in Vercel.

### Step 3: Test Registration

After migrations complete, test:

```bash
curl -X POST 'https://moments-us-app.vercel.app/api/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "phone": "+1234567890",
    "timezone": "UTC"
  }'
```

Should return `201` with user data instead of `500`.

---

## Security Note

- The migration endpoint is one-time use only
- Once migrations are complete, you can remove the endpoint from the codebase
- The token should be a strong random string, not a simple password
- Only valid with exact token match

