#!/usr/bin/env bash
set -Eeuo pipefail

container_name="${BEWERBRADAR_CONTAINER_NAME:-reactive_resume-jadeai-1}"
source_db="${BEWERBRADAR_SQLITE_PATH:-/app/data/bewerbradar.db}"
backup_dir="${BEWERBRADAR_BACKUP_DIR:-/app/data/backups}"
retention_days="${BEWERBRADAR_BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
backup_path="${backup_dir}/bewerbradar-${timestamp}.db"

if ! [[ "$retention_days" =~ ^[0-9]+$ ]] || [ "$retention_days" -lt 1 ]; then
  echo 'BEWERBRADAR_BACKUP_RETENTION_DAYS must be a positive integer.' >&2
  exit 2
fi

running="$(docker inspect -f '{{.State.Running}}' "$container_name" 2>/dev/null || true)"
if [ "$running" != 'true' ]; then
  echo "Application container is not running: ${container_name}" >&2
  exit 3
fi

docker exec "$container_name" mkdir -p "$backup_dir"

docker exec \
  -e SOURCE_DB="$source_db" \
  -e BACKUP_PATH="$backup_path" \
  "$container_name" \
  node -e '
const Database = require("better-sqlite3");

(async () => {
  const source = new Database(process.env.SOURCE_DB, { readonly: true });
  try {
    await source.backup(process.env.BACKUP_PATH);
  } finally {
    source.close();
  }

  const backup = new Database(process.env.BACKUP_PATH, { readonly: true });
  try {
    const integrity = backup.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") throw new Error(`integrity_check returned ${integrity}`);
  } finally {
    backup.close();
  }
})().catch((error) => {
  console.error(error instanceof Error ? error.message : "SQLite backup failed");
  process.exit(1);
});'

docker exec "$container_name" \
  find "$backup_dir" -type f -name 'bewerbradar-*.db' -mtime "+${retention_days}" -delete

size_bytes="$(docker exec "$container_name" stat -c '%s' "$backup_path")"
echo "SQLite backup verified: ${backup_path} (${size_bytes} bytes)"
