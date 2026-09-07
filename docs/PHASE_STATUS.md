# Advisory Generator Phase Verification

Last verified: 7 September 2026

This file records what is actually present in `main`. A phase is only marked complete when its required behaviour exists in code. Planned behaviour documented in the README does not count as implementation.

| Phase | Status | Verified implementation | Remaining work |
| --- | --- | --- | --- |
| 1 — Design engine foundation | Complete foundation | React/Vite workspace, structured advisory schema, three SVG compositions, live text editing, reference gallery and SVG/PNG export | Add more production templates as later phases mature |
| 2 — AI content service | Implemented, live provider verification pending | Server-side Gemini/Vertex AI adapter, strict JSON response schema, AI-first frontend client, timeout/error handling, deterministic local fallback and passing CI build/server syntax checks | Configure credentials in deployment and complete a live provider generation test |
| 3 — Design intelligence | In progress | Topic classification, preferred-template recommendation, measured text width/wrapping, per-template fit geometry, automatic best-fit layout selection, manual Auto-fit control and export blocking for clipped text | Auto-shortening, responsive reflow within templates, spacing/collision geometry and smarter template mutation |
| 4 — Reference analysis | Partial | Existing advisory artwork is indexed and searchable | Tag each reference by category, composition, visual family, text density, section structure and illustration placement; use tags for ranking |
| 5 — Illustration system | Not started | Current templates contain only small hard-coded generic SVG visuals | Build reusable approved SVG asset library and scene composer |
| 6 — Client branding | Not started | One Innvikta brand token set exists | Brand profiles, logo rules, typography profiles and client-specific safe areas |
| 7 — Advanced editor | Partial | Content fields, template switching and Auto-fit are editable | Direct canvas selection, drag/resize, layers, locking, alignment guides, undo/redo and asset replacement |
| 8 — Quality checker | Partial | Required-content checks, measured text overflow, layout-fit scoring and export gating | Visual collision, contrast, whitespace, alignment, logo safe-zone and asset-quality checks |

## Phase 2 implementation map

- `src/lib/contentService.js` — calls the AI endpoint, validates the returned schema and falls back to the local engine safely.
- `server/advisoryPrompt.js` — Innvikta advisory writing rules and strict structured-output JSON schema.
- `server/geminiProvider.js` — server-only Google Gemini or Vertex AI provider using `@google/genai`.
- `server/index.js` — `/api/advisories/generate` and `/api/health` endpoints with validation and request-size limits.
- `.env.example` — Vertex AI service-account/ADC and Gemini API-key configuration options.
- `vite.config.js` — local `/api` proxy to the content service.
- `src/App.jsx` — asynchronous AI-first generation states and visible fallback/source status.

## Phase 3 implementation map

- `src/lib/designIntelligence.js` — measures text using browser canvas metrics, models each template's actual text regions, identifies overflow and ranks approved layouts by fit.
- `src/lib/qualityChecker.js` — consumes measured overflow results and prevents export when text would be clipped.
- `src/App.jsx` — automatically selects the best-fitting approved layout after generation and exposes an Auto-fit control after manual edits.

## Verification rule

Phase 2 is considered fully production-verified only after both of these pass:

1. `npm run build`
2. A live `/api/advisories/generate` request with configured Gemini or Vertex AI credentials that returns exactly four points in each section and passes the frontend schema validator.

The GitHub Actions verification has passed dependency installation, server syntax checks and the production frontend build for the Phase 2 code path.

The deterministic local generator remains the fallback so AI failure never makes the editor unusable.
