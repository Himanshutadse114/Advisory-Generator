# Advisory Generator Phase Verification

Last verified: 7 September 2026

This file records what is actually present in `main`. A phase is marked complete only when its required product behaviour is implemented in code and covered by repository verification. A live third-party AI call is an environment/deployment check and is tracked separately because credentials are not stored in this repository.

| Phase | Status | Verified implementation |
| --- | --- | --- |
| 1 — Design engine foundation | Complete | React/Vite workspace, strict advisory document schema, three production SVG compositions, editable content, vector rendering and clean SVG/PNG/print-SVG export |
| 2 — AI content service | Complete in code | Server-side Gemini/Vertex AI adapter, strict structured-output schema, request validation, AI-first client, timeout handling, local fallback and server-only credentials |
| 3 — Design intelligence | Complete | Measured text fitting, three-layout scoring, automatic template fallback, deterministic copy tightening, Auto-fit and export blocking for clipped content |
| 4 — Reference intelligence | Complete | All 25 approved reference advisories tagged by category, visual family, density, illustration position and layout; topic-aware relevance ranking drives art direction |
| 5 — Illustration system | Complete | Reusable SVG primitives and topic-aware scenes for phishing, identity, fraud, device security, social engineering, privacy, network security, AI and general security |
| 6 — Client branding | Complete | Innvikta plus reusable brand profiles, custom colour controls, typography stack, footer rules, text/image logos and logo embedding in production exports |
| 7 — Advanced editor | Complete | Direct layer selection and dragging, X/Y positioning, scaling, locking, visibility, grid snapping, alignment guides, undo/redo, reset controls and illustration replacement |
| 8 — Quality assurance | Complete | Required-content checks, measured overflow, contrast audit, safe-zone checks, scale limits, required-layer visibility, approximate collision checks, quality scoring and export gating |

## Phase 1 acceptance

- `src/components/AdvisoryCanvas.jsx` renders 1080 × 1350 vector artwork.
- `src/lib/exportAdvisory.js` exports production SVG, high-resolution PNG and print-sized SVG.
- Editor selection UI is removed from exported artwork.

## Phase 2 acceptance

- `server/advisoryPrompt.js` defines the exact AI JSON schema and Innvikta writing rules.
- `server/geminiProvider.js` keeps Google AI credentials server-side.
- `server/index.js` exposes validated `/api/advisories/generate` and health routes.
- `src/lib/contentService.js` validates model responses and falls back to deterministic local content if AI is unavailable.
- The AI schema requires exactly four explanatory points and exactly four best-practice points.
- Supported categories include phishing, identity, fraud, device security, social engineering, privacy, network security and AI/emerging technology.

A real Gemini/Vertex provider request still requires credentials to be supplied in the deployment environment. The repository deliberately contains no production secret. This does not block the editor because deterministic fallback is built in.

## Phase 3 acceptance

- `src/lib/designIntelligence.js` models the real text regions for Editorial Hero, Split Story and Threat Flow.
- Browser canvas metrics are used for measured text fit with a deterministic Node approximation for tests.
- `rankTemplatesByFit` scores all approved layouts.
- `prepareAdvisoryForLayout` switches layouts and tightens copy when no original composition fits safely.
- Manual Auto-fit and Tighten Copy controls are available in the editor.

## Phase 4 acceptance

- `src/data/references.js` contains structured metadata for all 25 approved advisory examples.
- `src/lib/referenceIntelligence.js` scores topic/category/keyword relevance.
- The highest-ranked references provide a preferred layout, visual family and illustration direction.
- The References panel shows recommended examples plus the complete searchable library.

## Phase 5 acceptance

- `src/components/IllustrationLibrary.jsx` contains reusable SVG building blocks and scene compositions.
- The generator can render distinct visual concepts for messaging, identity, fraud, devices, people/social engineering, privacy, network security and AI.
- Illustration family can be replaced manually without changing the advisory content.

## Phase 6 acceptance

- `src/data/brands.js` defines reusable brand profiles and sanitisation.
- Custom client colours, fonts, footer wording and logo text can be edited in the Brand panel.
- Uploaded PNG/JPEG/WebP/SVG logos up to 2 MB are embedded as data URLs in the artwork.
- Brand contrast is included in QA before export.

## Phase 7 acceptance

- `src/lib/editorState.js` defines seven controlled production layers.
- `src/hooks/useDocumentHistory.js` provides undo and redo.
- Canvas layers support pointer selection and dragging.
- X, Y, scale, lock and visibility controls are available.
- Header and footer are protected by default.
- Movement snaps to an 8 px grid by default.
- Centre alignment guides are always visible in the advanced editor.
- Layer changes can be reset individually or for the full layout.

## Phase 8 acceptance

- `src/lib/qualityChecker.js` combines content validation, measured fit, brand checks and geometry checks.
- Body text must meet a 4.5:1 contrast target.
- Unsafe movement outside the canvas blocks export.
- Required hidden sections block export.
- Scale outside the approved 72–135% range blocks export.
- Known layer collisions block export.
- Export buttons remain disabled until blocking errors are resolved.

## Automated verification

Run locally:

```bash
npm install
npm run verify
```

`npm run verify` executes:

1. `scripts/verify-phases.mjs` — logic assertions across phases 2–8
2. `vite build` — production frontend build

GitHub Actions also runs:

- dependency installation
- server syntax checks
- phase logic checks
- production frontend build

The strict verification intentionally tests failure conditions as well as the happy path, including safe-zone violations and insufficient contrast.

## Product principle

The completed generator follows this controlled workflow:

**AI writes → reference library directs → approved layout fits → vector scene illustrates → brand profile applies → user edits layers → QA validates → SVG/PNG export.**

AI never receives unrestricted control over typography, placement or final branding.
