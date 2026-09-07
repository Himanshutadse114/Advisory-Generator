# Advisory Generator Phase Verification

Last verified: 7 September 2026

This file records what is actually present in `main`. A phase is only marked complete when its required behaviour exists in code. Planned behaviour documented in the README does not count as implementation.

| Phase | Status | Verified implementation | Remaining work |
| --- | --- | --- | --- |
| 1 — Design engine foundation | Complete foundation | React/Vite workspace, structured advisory schema, three SVG compositions, live text editing, reference gallery and SVG/PNG export | Add more production templates as later phases mature |
| 2 — AI content service | Implemented, runtime verification pending | Server-side Gemini/Vertex AI adapter, strict JSON response schema, AI-first frontend client, timeout/error handling and deterministic local fallback | Configure credentials in deployment and complete a live provider generation test |
| 3 — Design intelligence | Partial | Topic classification, template recommendation and character-count content-fit limits | Real text measurement, overflow geometry, auto-shortening, reflow and template fallback |
| 4 — Reference analysis | Partial | Existing advisory artwork is indexed and searchable | Tag each reference by category, composition, visual family, text density, section structure and illustration placement; use tags for ranking |
| 5 — Illustration system | Not started | Current templates contain only small hard-coded generic SVG visuals | Build reusable approved SVG asset library and scene composer |
| 6 — Client branding | Not started | One Innvikta brand token set exists | Brand profiles, logo rules, typography profiles and client-specific safe areas |
| 7 — Advanced editor | Partial | Content fields and template switching are editable | Direct canvas selection, drag/resize, layers, locking, alignment guides, undo/redo and asset replacement |
| 8 — Quality checker | Partial | Title, introduction, section heading, bullet length and missing-content checks with export gating | Visual collision, contrast, whitespace, alignment, logo safe-zone and measured overflow checks |

## Phase 2 implementation map

- `src/lib/contentService.js` — calls the AI endpoint, validates the returned schema and falls back to the local engine safely.
- `server/advisoryPrompt.js` — Innvikta advisory writing rules and strict structured-output JSON schema.
- `server/geminiProvider.js` — server-only Google Gemini or Vertex AI provider using `@google/genai`.
- `server/index.js` — `/api/advisories/generate` and `/api/health` endpoints with validation and request-size limits.
- `.env.example` — Vertex AI service-account/ADC and Gemini API-key configuration options.
- `vite.config.js` — local `/api` proxy to the content service.
- `src/App.jsx` — asynchronous AI-first generation states and visible fallback/source status.

## Verification rule

Phase 2 is considered fully production-verified only after both of these pass:

1. `npm run build`
2. A live `/api/advisories/generate` request with configured Gemini or Vertex AI credentials that returns exactly four points in each section and passes the frontend schema validator.

The deterministic local generator remains the fallback so AI failure never makes the editor unusable.
