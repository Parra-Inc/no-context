#!/bin/bash

set -e

echo "🌱 Running all seed scripts..."
echo ""

# Seed main database
echo "1️⃣ Seeding main PostgreSQL database..."
pnpm prisma db seed

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Seed slackhog database
echo "2️⃣ Seeding slackhog SQLite database..."
cd dev/slackhog
pnpm seed
cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ All databases seeded successfully!"
echo ""
echo "🚀 Ready to test:"
echo "   • Main app: pnpm dev → http://localhost:3000"
echo "   • Slackhog: http://localhost:9002"
echo ""
