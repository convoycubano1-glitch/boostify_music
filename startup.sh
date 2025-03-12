
#!/bin/bash
# Production startup script - Prepares and launches the application for Autoscale deployment

echo "🚀 Starting production deployment process..."

# Clean up broken symlinks - this resolves the symlink warnings
echo "🧹 Cleaning up broken symlinks..."
find /tmp -type l -exec test ! -e {} \; -delete
echo "✅ Symlink cleanup complete"

# Set production environment
export NODE_ENV=production

# Check for critical environment variables
echo "🔐 Verifying environment variables..."
for VAR in DATABASE_URL OPENAI_API_KEY SESSION_SECRET; do
  if [ -z "${!VAR}" ]; then
    echo "⚠️ Warning: $VAR is not set"
  else
    echo "✅ $VAR is configured"
  fi
done

# Start the application in production mode
echo "🌐 Starting application in production mode..."
npm start
