# Aira Phase 1 Implementation Report

Date: 4 November 2026

## Delivered

- Official branding: Aira, “Your intelligent MediCare+ assistant,” “Ask Aira,” and the approved welcome message.
- Native floating launcher in the authenticated application shell.
- Responsive right-side desktop panel and full-screen mobile experience.
- English LTR and Arabic RTL layout, placement, labels, and starter prompts.
- Conversation history, new conversations, streaming response animation, stop, retry, copy, loading, empty, and error states.
- Keyboard support: Enter sends, Shift+Enter adds a line, Escape closes history/panel, and controls have accessible labels.
- Secure Express gateway with a local Ollama streaming adapter and an optional official OpenAI adapter.
- User-owned Prisma conversations and messages with expiry timestamps.
- SSE streaming, abort-based cancellation, bounded context/output, provider timeouts, and per-user rate limiting.
- Lifecycle audit events with token usage but without prompt/response content.

## Files created

- `MEDICARE_AI_ARCHITECTURE.md`
- `AIRA_PHASE_1_IMPLEMENTATION_REPORT.md`
- `MEDICARE_AI_PHASE_1_REPORT.md`
- `backend/prisma/migrations/20261104090000_aira_phase_1/migration.sql`
- `backend/src/routes/ai.routes.ts`
- `backend/src/services/ai-conversation.service.ts`
- `backend/src/services/ai-provider.service.ts`
- `src/app/features/ai-assistant/models/ai-conversation.model.ts`
- `src/app/features/ai-assistant/services/ai-chat.service.ts`
- `src/app/features/ai-assistant/components/aira-assistant/aira-assistant.ts`
- `src/app/features/ai-assistant/components/aira-assistant/aira-assistant.html`
- `src/app/features/ai-assistant/components/aira-assistant/aira-assistant.scss`

## Files modified

- `backend/package.json` and `backend/package-lock.json` — official provider SDK.
- `backend/prisma/schema.prisma` — Aira conversation relations and models.
- `backend/src/app.ts` — AI gateway registration.
- `backend/src/config/env.ts` and `backend/.env.example` — validated provider, model, timeout, token, and retention settings.
- `src/app/layout/main-layout/main-layout.ts` and `.html` — authenticated global Aira mount.

## API endpoints

- `POST /api/v1/ai/conversations`
- `GET /api/v1/ai/conversations`
- `GET /api/v1/ai/conversations/:id`
- `DELETE /api/v1/ai/conversations/:id`
- `POST /api/v1/ai/conversations/:id/messages` (SSE)
- `POST /api/v1/ai/conversations/:id/cancel`

All endpoints require authentication. Record endpoints enforce current-user ownership.

## Database migration

Migration `20261104090000_aira_phase_1` creates `AIConversation` and `AIMessage`, ownership and cascade foreign keys, and indexes for history and retention queries. The migration file is included; deployment status is recorded under verification below.

## Security controls

- Server-only provider key and fail-closed environment validation.
- No arbitrary SQL, domain tools, patient retrieval, or record mutations.
- User ownership enforced independently of model behavior.
- Plain-text rendering prevents model HTML/script execution.
- 4,000-character input, bounded 20-message context, configurable output tokens and timeouts.
- Per-user rate limiting and non-sensitive auditing.
- Default-disabled provider and configurable 30-day expiry.

## Verification performed

- `npx prisma format` — passed.
- `npx prisma generate` — passed.
- `npm run build` in `backend` — passed.
- Local Ollama provider smoke test with `qwen3:1.7b` — passed and returned streamed text plus token usage.
- `npm run build` in the Angular application — passed from the canonical repository path.
- `npm test` in `backend` — 8 files, 46 tests passed.
- `npm test -- --watch=false` in the Angular application — 58 files, 189 tests passed.
- `npx prisma migrate deploy` — migration applied successfully to the configured `hospital_management` PostgreSQL database.

Existing Angular warnings remain for unused Radiology imports and stylesheet budgets. Aira's stylesheet also exceeds the current per-component warning budget; this is a warning, not a build failure.

## Known limitations

- Phase 1 intentionally has no hospital record lookup, reporting, or workflow tools. Suggestions therefore advertise only implemented general assistance.
- Local responses require Ollama to be running with the configured model. Vercel cannot reach a workstation-local Ollama instance; production stays disabled until a private remote model host is available.
- The existing application is single-hospital rather than tenant-scoped.
- Cancellation coordination is in-memory per API process.
- Deterministic retention cleanup requires a scheduled production job.
- Responses are safe plain text rather than rendered Markdown.

## Next-phase prerequisites

Phase 2 must not begin until the architecture/security review is approved, provider privacy terms are accepted, tenant strategy is confirmed, AI-specific permissions are agreed, and each proposed data tool has strict schemas, limits, independent authorization, and security tests.

## Post-Phase-1 read-only capability update

Following explicit product direction, Aira now supports a limited allowlisted read-only retrieval layer for patient search, appointments, pending appointment payments, report summaries, and low-stock medicines. Each tool reuses an existing domain service, checks the current JWT permission independently, limits results to ten records, minimizes returned fields, uses fixed navigation routes, and writes tool identifiers—not results—to the audit trail. No mutation or unrestricted database access was introduced.
