#!/usr/bin/env bash
set -euo pipefail

BASE=/home/univates
REPO_DIR=$BASE/bruxel
LOG=$BASE/deploy/deploy.log

exec 9>"$BASE/deploy/deploy.lock"
flock 9

exec >>"$LOG" 2>&1
echo "=== deploy iniciado em $(date -Is) ==="

cd "$REPO_DIR"
git fetch --prune origin main
git reset --hard origin/main
COMMIT=$(git rev-parse --short HEAD)
echo "commit: $COMMIT"

sudo docker compose build backend
sudo docker compose build frontend
sudo docker compose up -d --remove-orphans --wait --wait-timeout 180
sudo docker image prune -f

echo "$COMMIT" > "$BASE/deploy/ultimo_commit"
echo "=== deploy concluido em $(date -Is) ==="
