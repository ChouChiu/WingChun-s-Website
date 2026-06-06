#!/bin/bash

# Deploy script for GitHub Contribution API
# Run from the server/ directory: ./deploy.sh

set -e

VPS_HOST="ssh.wwchun.top"
VPS_USER="root"
REMOTE_DIR="/opt/github-contribution-api"

echo "Typechecking..."
bun run typecheck

echo "Deploying to VPS..."
ssh ${VPS_USER}@${VPS_HOST} "rm -rf ${REMOTE_DIR}/features ${REMOTE_DIR}/shared ${REMOTE_DIR}/index.ts ${REMOTE_DIR}/package.json ${REMOTE_DIR}/tsconfig.json"
scp -r features shared index.ts package.json tsconfig.json deploy.sh nginx.conf github-contribution-api.service README.md ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/

echo "Installing dependencies on VPS..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${REMOTE_DIR} && bun install --frozen-lockfile"

echo "Restarting service..."
ssh ${VPS_USER}@${VPS_HOST} "systemctl restart github-contribution-api"

echo "Checking service status..."
ssh ${VPS_USER}@${VPS_HOST} "systemctl status github-contribution-api --no-pager"

echo "Deployment complete!"
