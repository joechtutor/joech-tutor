# JOECH TUTOR Secure Assessment Platform

A production-oriented Next.js + Supabase foundation for Mathematics and English assessment for Grades 5–9.

## Security architecture
- Supabase Auth for password/session management.
- PostgreSQL with Row Level Security (RLS).
- Roles: admin, teacher, student, parent.
- Explicit assessment assignment so students cannot browse the whole assessment bank.
- Correct answers are never returned by the student assessment GET endpoint.
- Server-side scoring and grading in the submit API.
- Zod validation for assessment submissions.
- Backup script for trusted infrastructure.

## Run locally
1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill Supabase URL + publishable/anon key.
4. Apply the SQL files in Supabase SQL Editor (migration first, seed second).
5. `npm run dev`

## Production
Deploy the Next.js app to Vercel and connect a Supabase project. Supabase's current Next.js guidance uses cookie-based Auth with `@supabase/ssr`; Vercel provides a Supabase starter/integration. Configure environment variables in the cloud provider, never in source control.

## Backups
Run `scripts/backup.sh` from trusted infrastructure with `SUPABASE_DB_URL`. Store resulting dumps in encrypted off-site object storage and test restoration on a schedule.

## Before real student use
Enable MFA for privileged accounts, email verification/password reset, rate limiting, audit logging, monitoring, retention/deletion rules, privacy notices, and a tested disaster-recovery procedure. This repository is a secure foundation, not a completed security certification.
