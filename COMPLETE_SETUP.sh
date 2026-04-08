#!/bin/bash

# Moments - Vercel Remaining Variables Setup Helper
# This script adds the 5 missing environment variables to Vercel and triggers redeploy

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║    Moments - Add Final 5 Environment Variables to Vercel       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed"
    echo "Install with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""
echo "Adding 5 remaining environment variables to Production environment..."
echo ""

# Add the 5 remaining variables
echo "Adding DB_CONNECTION..."
vercel env add DB_CONNECTION pgsql --environment=production 2>/dev/null || echo "⚠️  DB_CONNECTION might already exist"

echo "Adding CACHE_DRIVER..."
vercel env add CACHE_DRIVER array --environment=production 2>/dev/null || echo "⚠️  CACHE_DRIVER might already exist"

echo "Adding SESSION_DRIVER..."
vercel env add SESSION_DRIVER array --environment=production 2>/dev/null || echo "⚠️  SESSION_DRIVER might already exist"

echo "Adding FILESYSTEM_DISK..."
vercel env add FILESYSTEM_DISK s3 --environment=production 2>/dev/null || echo "⚠️  FILESYSTEM_DISK might already exist"

echo "Adding QUEUE_CONNECTION..."
vercel env add QUEUE_CONNECTION sync --environment=production 2>/dev/null || echo "⚠️  QUEUE_CONNECTION might already exist"

echo ""
echo "✅ Variables added/verified!"
echo ""
echo "🚀 Now redeploying your project..."
echo ""

# Redeploy
vercel redeploy --prod

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment triggered!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏱️  Wait 2-3 minutes for the deployment to complete"
echo ""
echo "🧪 Then test your app:"
echo "   https://moments-us-app.vercel.app"
echo ""
echo "📝 After that, run migrations:"
echo "   cd backend && php artisan migrate --force"
echo ""
echo "🎉 Done! Your registration form should now work!"
echo ""
