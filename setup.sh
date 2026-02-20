#!/usr/bin/env bash
set -euo pipefail

echo "=== No Context — Setup ==="
echo ""

# 1. Copy .env.example → .env (if .env doesn't exist)
if [ -f .env ]; then
  echo "✓ .env already exists, skipping copy"
else
  cp .env.example .env

  # Generate NEXTAUTH_SECRET
  secret=$(openssl rand -base64 32)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${secret}|" .env
  else
    sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${secret}|" .env
  fi

  # Generate TOKEN_ENCRYPTION_KEY (64-char hex)
  enc_key=$(openssl rand -hex 32)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^TOKEN_ENCRYPTION_KEY=.*|TOKEN_ENCRYPTION_KEY=${enc_key}|" .env
  else
    sed -i "s|^TOKEN_ENCRYPTION_KEY=.*|TOKEN_ENCRYPTION_KEY=${enc_key}|" .env
  fi

  echo "✓ Created .env with generated secrets"
fi

# 2. Start Postgres via Docker Compose
echo ""
echo "Starting Postgres..."
docker compose up -d
echo "✓ Postgres running on localhost:5433"

# 3. Install dependencies & set up database
echo ""
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

echo ""
echo "Running database migrations..."
npx prisma generate
npx prisma migrate dev
echo "✓ Database ready"

echo ""
echo "=== Setup complete! ==="
echo "Run 'npm run dev' to start the app."
