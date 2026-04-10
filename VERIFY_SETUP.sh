#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Moments - Verify Vercel Setup is Complete              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Install: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""
echo "Checking your Vercel environment variables..."
echo ""

# Pull env vars
vercel env pull --yes 2>/dev/null

# Check if variables exist
echo "Verifying required variables are set..."
echo ""

required_vars=(
    "APP_KEY"
    "DB_CONNECTION"
    "DB_HOST"
    "DB_PORT"
    "DB_DATABASE"
    "DB_USERNAME"
    "DB_PASSWORD"
    "DB_SSLMODE"
    "AWS_BUCKET"
    "AWS_ENDPOINT"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "CACHE_DRIVER"
    "SESSION_DRIVER"
    "FILESYSTEM_DISK"
    "QUEUE_CONNECTION"
    "CORS_ALLOWED_ORIGINS"
)

count=0
for var in "${required_vars[@]}"; do
    if grep -q "^$var=" .env.local 2>/dev/null; then
        echo "✅ $var"
        ((count++))
    else
        echo "❌ $var (missing)"
    fi
done

echo ""
echo "Variables configured: $count/${#required_vars[@]}"
echo ""

if [ $count -eq ${#required_vars[@]} ]; then
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║ ✅ ALL VARIABLES ARE CONFIGURED!                              ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://vercel.com/dashboard/moments"
    echo "2. Go to Deployments tab"
    echo "3. Click ... on latest deployment"
    echo "4. Click Redeploy"
    echo "5. Wait 2-3 minutes for Ready status"
    echo "6. Test: https://moments-us-app.vercel.app/"
    echo ""
    echo "Then run migrations:"
    echo "cd backend && php artisan migrate --force"
    echo ""
else
    echo "❌ Some variables are missing!"
    echo ""
    echo "Add missing variables using:"
    echo "bash COMPLETE_SETUP.sh"
    echo ""
fi

# Cleanup
rm -f .env.local
