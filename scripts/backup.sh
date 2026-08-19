#!/usr/bin/env bash
set -euo pipefail
mkdir -p backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump "$SUPABASE_DB_URL" --format=custom --file="backups/joech_$stamp.dump"
echo "Backup created: backups/joech_$stamp.dump"
