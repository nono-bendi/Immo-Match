#!/bin/bash
set -e
DATE=$(date +%Y-%m-%d_%H%M)
BACKUP_DIR="/app/backups/$DATE"
mkdir -p "$BACKUP_DIR"
cp /app/agencies.db "$BACKUP_DIR/agencies.db"
cp -r /app/data/ "$BACKUP_DIR/data"
ls -dt /app/backups/*/ 2>/dev/null | tail -n +8 | xargs rm -rf 2>/dev/null || true
echo "Backup OK → $BACKUP_DIR"
