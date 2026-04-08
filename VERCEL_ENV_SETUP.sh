#!/bin/bash

# Moments - Vercel Environment Variables Setup Script
# This script helps you configure all necessary environment variables for Vercel deployment
# Usage: bash VERCEL_ENV_SETUP.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Moments - Vercel Environment Variables Setup           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will help you add environment variables to your Vercel project."
echo "You must have the Vercel CLI installed: npm install -g vercel"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📌 Before continuing, make sure you have:"
echo "   1. Your Neon database credentials"
echo "   2. Your Cloudflare R2 access key and secret"
echo "   3. Your Vercel project linked (vercel login)"
echo ""
read -p "Press Enter to continue..."
echo ""

# Prompt for values
echo "🔐 Enter your configuration values:"
echo ""

read -p "APP_KEY (default: base64:vy6dXzl9qTfPiCzZtBJBGb7JGbc9hInaiobAXX9tjY8=): " APP_KEY
APP_KEY="${APP_KEY:-base64:vy6dXzl9qTfPiCzZtBJBGb7JGbc9hInaiobAXX9tjY8=}"

read -p "DB_HOST (Neon pooler host): " DB_HOST
read -p "DB_DATABASE (default: neondb): " DB_DATABASE
DB_DATABASE="${DB_DATABASE:-neondb}"

read -p "DB_USERNAME (default: neondb_owner): " DB_USERNAME
DB_USERNAME="${DB_USERNAME:-neondb_owner}"

read -sp "DB_PASSWORD (hidden input): " DB_PASSWORD
echo ""

read -p "AWS_ACCESS_KEY_ID (R2 access key): " AWS_ACCESS_KEY_ID
read -sp "AWS_SECRET_ACCESS_KEY (R2 secret key, hidden): " AWS_SECRET_ACCESS_KEY
echo ""

read -p "AWS_BUCKET (default: moments-media): " AWS_BUCKET
AWS_BUCKET="${AWS_BUCKET:-moments-media}"

read -p "AWS_ENDPOINT (R2 endpoint URL): " AWS_ENDPOINT

read -p "CORS_ALLOWED_ORIGINS (your Vercel frontend URL): " CORS_ALLOWED_ORIGINS

echo ""
echo "📝 Setting environment variables..."
echo ""

# Set all environment variables (production only)
vercel env add APP_KEY "$APP_KEY" --environment=production
vercel env add DB_CONNECTION pgsql --environment=production
vercel env add DB_HOST "$DB_HOST" --environment=production
vercel env add DB_PORT 5432 --environment=production
vercel env add DB_DATABASE "$DB_DATABASE" --environment=production
vercel env add DB_USERNAME "$DB_USERNAME" --environment=production
vercel env add DB_PASSWORD "$DB_PASSWORD" --environment=production
vercel env add DB_SSLMODE require --environment=production
vercel env add AWS_ACCESS_KEY_ID "$AWS_ACCESS_KEY_ID" --environment=production
vercel env add AWS_SECRET_ACCESS_KEY "$AWS_SECRET_ACCESS_KEY" --environment=production
vercel env add AWS_BUCKET "$AWS_BUCKET" --environment=production
vercel env add AWS_ENDPOINT "$AWS_ENDPOINT" --environment=production
vercel env add CORS_ALLOWED_ORIGINS "$CORS_ALLOWED_ORIGINS" --environment=production

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "🚀 Now you need to:"
echo "   1. Redeploy your project on Vercel"
echo "   2. Run database migrations: php artisan migrate --force"
echo "   3. Test the API at https://your-domain.app/api/health"
echo ""
echo "💡 To redeploy: vercel redeploy --prod"
echo ""
