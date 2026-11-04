# MediCare+ AI Assistant — Phase 1 Architecture

## Discovered application architecture

MediCare+ is an Angular 22 standalone-component application backed by an Express 5 / Node.js API. PostgreSQL persistence is accessed through Prisma 6. The frontend authenticates with a short-lived JWT access token and refresh token managed by `AuthStore`; the backend validates the JWT in `authenticate` and applies permission middleware at route boundaries. Roles and permissions are database-backed.

The application is currently a single-hospital deployment. `HospitalSettings` is a singleton and domain records do not contain a tenant or hospital foreign key. Consequently Phase 1 can enforce user ownership, but it cannot add a tenant predicate that the current data model does not support. A future multi-hospital rollout must introduce tenant identity and scope every AI and domain query before data tools are enabled.

The authenticated shell is `MainLayout`. It already owns global navigation, language selection, notification UI, responsive breakpoints, and Arabic RTL direction through `LanguageService`. Shared colors and surface tokens are defined globally. The API has centralized validation, error handling, rate limiting, Prisma access, audit records, and Pino logging.

## Phase 1 integration

```text
Authenticated Angular shell
  └─ AiraAssistant
      └─ AIChatService (REST + SSE)
          └─ /api/v1/ai (JWT required, rate limited)
              └─ AIConversationService (ownership + retention + audit)
                  ├─ Prisma: AIConversation / AIMessage
                  └─ AIProviderService
                      ├─ Ollama local streaming API (no provider fee)
                      └─ optional official OpenAI Node SDK (server credentials only)
```

The floating launcher and chat panel are mounted only inside the authenticated layout. REST calls manage conversation lifecycle. The message endpoint streams text as Server-Sent Events. Plain Angular interpolation renders response text, which prevents model-generated HTML from executing.

## Security boundaries

- Every Aira route requires a valid access token.
- Every read, delete, cancel, and message request verifies conversation ownership.
- The browser never receives the provider API key.
- Provider selection, model, timeout, output limit, and retention are server environment settings.
- Context is bounded to the last 20 completed messages; input is limited to 4,000 characters and output to 1,000 tokens by default.
- Phase 1 registers no patient, billing, appointment, report, inventory, SQL, or mutation tools.
- The system prompt explicitly prohibits invented hospital data and medical advice.
- Audit events store lifecycle status and token counts, not message content.
- Conversations receive an expiry timestamp and expired conversations are deleted during owner list access.
- The API applies a per-user Aira rate limit. Provider failures do not affect ordinary MediCare+ modules.

## Persistence and retention

`AIConversation` belongs to one `User` and cascades deletion to `AIMessage`. `expiresAt` is refreshed after activity. The default retention period is 30 days and is configurable from 1–365 days. A scheduled production cleanup should delete expired records independently of user access; Phase 1 also performs opportunistic cleanup when history is loaded.

Full patient records are not copied into chat history. Because Phase 1 has no domain tools, stored content is limited to the user's prompt and Aira's general response.

## Provider behavior

`AI_PROVIDER=disabled` is the safe default. Local development may use `AI_PROVIDER=ollama`; the adapter calls Ollama's streaming chat API, supports abort signals and timeouts, and records reported token usage. Setting `AI_PROVIDER=openai` requires `OPENAI_API_KEY` and uses the optional official SDK. Production refuses a localhost Ollama URL because Vercel cannot reach a model running on a developer workstation. Any remote model host must undergo the same privacy, network, and retention review.

## Risks and dependencies

- Healthcare/privacy approval and a provider data-processing agreement are required before sending production user content externally.
- The single-hospital schema is not safe for multi-tenant AI data retrieval without a tenancy migration.
- Cancellation is process-local. A distributed deployment needs shared generation coordination or sticky routing.
- Expired-record cleanup needs a scheduled job for deterministic retention enforcement.
- Markdown is intentionally not rendered in Phase 1; responses are safe plain text.
- Phase 2 requires separately reviewed, allowlisted tools with independent permission and record-scope enforcement. It must not start merely by enabling the model.

## Phase 2 gate

Do not add natural-language hospital data search until provider privacy approval, tenant strategy, tool-specific permissions, output minimization, prompt-injection tests, and cross-user/cross-tenant security tests are approved.
