#!/usr/bin/env bash
# Apply ClinIQ core schema (supabase/schema/cliniq_core_v1.sql) to self-hosted Supabase Postgres.
# Run this ON the VPS (SSH), not from Cursor.
#
# 1) Copy the SQL file to the server (example from your laptop):
#    scp supabase/schema/cliniq_core_v1.sql user@YOUR_VPS:/tmp/
# 2) Find the DB container name:
#    docker ps --format '{{.Names}}' | grep -i db
# 3) Run:
#    SUPABASE_DB_CONTAINER=cliniq-supabase-XXXXX-supabase-db \
#      bash scripts/apply-cliniq-core-schema-vps.sh /tmp/cliniq_core_v1.sql
#
# Optional seed (after schema succeeds):
#    docker exec -i "$SUPABASE_DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
#      < supabase/seed/cliniq_core_seed_v1.sql
#
# Read the header in cliniq_core_v1.sql if you have legacy tables with the same names.

set -euo pipefail

SQL_FILE="${1:-}"
CONTAINER="${SUPABASE_DB_CONTAINER:-}"

if [[ -z "$SQL_FILE" ]]; then
  echo "Usage: SUPABASE_DB_CONTAINER=<postgres-container-name> $0 /path/to/cliniq_core_v1.sql" >&2
  exit 1
fi
if [[ ! -f "$SQL_FILE" ]]; then
  echo "File not found: $SQL_FILE" >&2
  exit 1
fi
if [[ -z "$CONTAINER" ]]; then
  echo "Set SUPABASE_DB_CONTAINER to your Supabase Postgres container name (see docker ps)." >&2
  exit 1
fi

docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <"$SQL_FILE"
echo "Schema applied: $SQL_FILE"
