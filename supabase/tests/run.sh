#!/usr/bin/env bash
# Runs the migrations and RLS tests against a throwaway local Postgres.
# Usage: DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:db
set -euo pipefail
cd "$(dirname "$0")/../.."
URL="${DATABASE_URL:?Set DATABASE_URL to a disposable Postgres database}"
DB="schooldesk_test_$$"
psql "$URL" -qc "create database $DB"
trap 'psql "$URL" -qc "drop database if exists $DB" >/dev/null' EXIT
TEST_URL="${URL%/*}/$DB"
psql "$TEST_URL" -v ON_ERROR_STOP=1 -q -f supabase/tests/stub_supabase.sql
for f in supabase/migrations/*.sql; do psql "$TEST_URL" -v ON_ERROR_STOP=1 -q -f "$f"; done
psql "$TEST_URL" -v ON_ERROR_STOP=1 -q -f supabase/tests/rls_test.sql 2>&1 | grep -E "ok |FAIL|ERROR"
