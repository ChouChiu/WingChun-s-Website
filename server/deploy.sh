#!/bin/bash

# Deploy script for GitHub Contribution API

set -e

VPS_HOST="ssh.wwchun.top"
VPS_USER="root"
REMOTE_DIR="/opt/github-contribution-api"

echo "Building server..."
cd server
bun install --frozen-lockfile
bun run build

echo "Deploying to VPS..."
scp -r ./* ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/

echo "Installing dependencies on VPS..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${REMOTE_DIR} && bun install --frozen-lockfile"

echo "Restarting service..."
ssh ${VPS_USER}@${VPS_HOST} "systemctl restart github-contribution-api"

echo "Checking service status..."
ssh ${VPS_USER}@${VPS_HOST} "systemctl status github-contribution-api --no-pager"

echo "Deployment complete!"
