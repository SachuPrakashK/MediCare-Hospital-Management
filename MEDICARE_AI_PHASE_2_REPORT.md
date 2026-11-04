# MediCare+ AI Assistant — Phase 2 Initial Read-Only Retrieval Report

Date: 4 November 2026

## Implemented tools

- `search_patients` — requires `patients.view`; accepts a name or MRN and returns a maximum of ten minimal patient references.
- `search_appointments` — requires `appointments.view`; supports today's appointments and pending-payment appointment queries with a maximum of ten results.
- `get_report_summary` — requires `reports.view`; financial totals are included only with `billing.view`.
- `get_low_stock_medicines` — requires `pharmacy.view`; returns a maximum of ten low-stock batches.

## Security controls

- Deterministic allowlisted intent routing; the model cannot generate SQL or select arbitrary services.
- Existing domain services remain the source of truth.
- JWT permissions are passed from the authenticated route and checked per tool.
- Results are field-minimized and bounded.
- Navigation targets are fixed application routes rather than model-generated URLs.
- Tool results are labeled as untrusted context in the provider system prompt.
- Audit records contain tool identifiers only, not retrieved patient or financial content.
- No create, update, delete, clinical advice, or financial mutation capability exists.

## Verification

- Backend TypeScript build passed.
- Backend suite: 8 files and 46 tests passed.
- Angular production build passed.
- Angular suite: 58 files and 189 tests passed.
- Live PostgreSQL → tool registry → Ollama checks passed for hospital reports and pending payments; both returned factual responses without the former access refusal.

## Known limitations

- Intent routing currently covers the approved starter queries and close natural-language variants, not every possible phrasing.
- Patient search asks for a name or MRN rather than returning a broad patient list.
- Results are capped at ten and direct users to the corresponding module for complete lists.
- Local Ollama must remain running. Vercel production cannot reach workstation-local Ollama.
- The application remains a single-hospital deployment and must add tenant scoping before multi-hospital use.
