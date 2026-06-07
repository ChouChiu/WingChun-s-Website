#!/bin/bash
set -e

# Sync script: sync changes from private repo (main) to STBlog (open-source)
# Usage: ./scripts/sync-stblog.sh

echo "=== STBlog Sync Script ==="
echo ""

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Error: Please run this script from the main branch"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

echo "Step 1: Creating sync branch..."
git checkout -b sync-temp

echo "Step 2: Removing sensitive directories..."
rm -rf src/features/hw-list
rm -rf src/features/math-games
rm -rf src/app/hw-list
rm -rf src/app/math-game
rm -rf public/hw-list
rm -f plan.md
rm -f scripts/homework-crawler.ts
rm -f .github/workflows/homework-crawler.yml
rm -f src/contents/blogs/contributions.md
rm -f src/contents/blogs/writing-1.md

echo "Step 3: Replacing sensitive strings..."

# Replace domain
sed -i '' 's|wwchun\.top|example.com|g' src/app/layout.tsx
sed -i '' 's|wwchun\.top|example.com|g' src/app/sitemap.ts
sed -i '' 's|wwchun\.top|example.com|g' src/app/robots.ts
sed -i '' 's|wwchun\.top|example.com|g' server/index.ts
sed -i '' 's|wwchun\.top|example.com|g' server/nginx.conf
sed -i '' 's|wwchun\.top|example.com|g' server/README.md
sed -i '' 's|wwchun\.top|example.com|g' ecosystem.config.cjs
sed -i '' 's|wwchun\.top|example.com|g' .github/workflows/deploy.yml
sed -i '' 's|wwchun\.top|example.com|g' AGENTS.md

# Replace personal name
sed -i '' 's|ChouChiu|YourName|g' src/app/layout.tsx
sed -i '' 's|ChouChiu|YourName|g' src/app/blog/\[id\]/page.tsx
sed -i '' 's|ChouChiu|YourName|g' src/shared/components/layout/navbar.tsx
sed -i '' 's|ChouChiu|YourName|g' src/shared/components/layout/profile-card.tsx
sed -i '' 's|ChouChiu|YOUR_USERNAME|g' server/features/github-contribution/routes.ts
sed -i '' 's|ChouChiu|YourName|g' server/README.md

# Replace email
sed -i '' 's|lshengevery@gmail.com|your@email.com|g' src/shared/components/layout/profile-card.tsx

# Replace Telegram
sed -i '' 's|wingchunwong111|your-telegram|g' src/shared/components/layout/profile-card.tsx

# Replace QQ number
sed -i '' 's|2750821684|00000000|g' src/shared/components/layout/profile-card.tsx

# Replace VPS host
sed -i '' 's|ssh\.wwchun\.top|your-server.com|g' server/deploy.sh
sed -i '' 's|ssh\.wwchun\.top|your-server.com|g' server/README.md

# Replace package name
sed -i '' "s|ChouChiu's-Website|stblog|g" package.json

# Remove math-game/hw-list from sitemap
sed -i '' '/math-game/,/priority: 0\.5,/d' src/app/sitemap.ts
sed -i '' '/hw-list/,/priority: 0\.7,/d' src/app/sitemap.ts

echo "Step 4: Committing changes..."
git add -A
git commit -m "sync: anonymize from private repo ($(date +%Y-%m-%d))"

echo "Step 5: Pushing to STBlog..."
git push STBlog sync-temp:main --force

echo "Step 6: Cleaning up..."
git checkout main
git branch -D sync-temp

echo ""
echo "=== Sync complete! ==="
echo "Changes have been pushed to https://github.com/ChouChiu/STBlog"
