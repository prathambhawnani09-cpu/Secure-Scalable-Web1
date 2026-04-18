# SymptomSense

## Overview

A production-ready SaaS application for detecting and preventing illness outbreaks in schools using real-time nurse visit data. The platform uses AI-powered pattern detection to automatically identify symptom clusters and alert administrators before outbreaks spread.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Tailwind CSS, shadcn/ui, Recharts, React Query)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Routing**: Wouter

## Architecture

- `artifacts/school-health/` — React + Vite frontend (served at `/`)
- `artifacts/api-server/` — Express API server (served at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — Drizzle ORM + PostgreSQL schemas

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Nurse | nurse@demo.school | password123 |
| Admin | admin@demo.school | password123 |
| Parent | parent@demo.school | password123 |

## Core Features

- **Fast nurse input interface** — Log student visits in under 30 seconds with symptom multi-select, temperature, action taken
- **AI pattern detection** — Automatic cluster/outbreak detection based on symptom patterns per classroom over time
- **Smart alert system** — Severity levels (low/medium/high), active alert banners, resolve with notes
- **Parent notifications** — Exposure alerts, cluster warnings, unread count
- **Admin dashboard** — Summary stats, symptom trend charts (Recharts), classroom heatmap, recent activity feed
- **Student health records** — Visit history, chronic conditions, risk scoring, allergies
- **Role-based access** — Nurses log visits, admins manage alerts/dashboard, parents see notifications
- **Demo data** — 15 students, 14 visits, 3 alerts (simulates the 5B outbreak scenario), 3 notifications

## Database Schema

- `users` — nurse/admin/parent accounts with hashed passwords
- `students` — student records with health conditions, parent contact info
- `visits` — nurse visit logs with symptoms, temperature, action taken
- `alerts` — auto-detected health clusters/outbreaks with severity levels
- `notifications` — parent notifications linked to alerts

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/school-health run dev` — run frontend locally

## API Endpoints

All endpoints are under `/api`:

- `POST /auth/login` — login with email/password, returns JWT token
- `GET /auth/me` — get current user
- `POST /auth/logout`
- `GET/POST /visits` — list/create nurse visits
- `GET /visits/:id` — visit details
- `GET/POST /students` — list/create students
- `GET /students/:id` — student detail with health history
- `GET /alerts` — list alerts (filter by status/severity)
- `GET /alerts/:id` — alert details
- `POST /alerts/:id/resolve` — resolve an alert with note
- `GET /dashboard/summary` — stats overview
- `GET /dashboard/symptom-trends` — trend data for charts
- `GET /dashboard/classroom-heatmap` — classroom risk heatmap
- `GET /dashboard/recent-activity` — activity feed
- `GET /notifications` — list notifications
- `POST /notifications/:id/read` — mark as read

## Email / OTP Setup (TODO)

Email sending is not yet configured. The Resend integration was not connected. To enable real OTP emails for signup:
- **Option A**: Connect Resend via Replit integrations (connector ID: `connector:ccfg_resend_01K69QKYK789WN202XSE3QS17V`) and swap nodemailer for the Resend SDK in `artifacts/api-server/src/routes/auth.ts`
- **Option B**: Set secrets `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` for nodemailer (already wired up in auth.ts)
- **Option C**: Connect SendGrid via Replit integrations (connector ID: `connector:ccfg_sendgrid_01K69QKAPBPJ4SWD8GQHGY03D5`)

Until configured, OTP codes are logged to the server console only — the signup flow will show an error to users.

## Outbreak Detection Logic

When a nurse logs a visit, the system automatically checks if more than 3 students from the same classroom reported visits in the past 7 days. If a symptom appears 3+ times, an alert is created. Severity levels:
- `low`: 3-4 students
- `medium`: 5-7 students  
- `high`: 8+ students (possible outbreak)
