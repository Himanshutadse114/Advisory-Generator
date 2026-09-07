# Innvikta Advisory Generator

A controlled advisory design engine for creating polished cybersecurity awareness advisories from structured content and reusable visual layouts.

## Current status

The repository now contains the first working generator foundation plus the Phase 2 AI content-service implementation:

- React + Vite editor
- Structured advisory content schema
- Server-side Gemini / Vertex AI content generation
- Strict JSON structured-output contract
- Automatic local-rule fallback when AI is unavailable
- Topic classification for common cybersecurity themes
- Three vector-safe advisory layouts
- Live editable title, introduction and guidance points
- Existing WebP advisories exposed as the reference library
- Live design-quality score with content-fit warnings
- Export blocking when required content is missing
- SVG export
- High-resolution PNG export
- Innvikta design tokens separated from generation logic
- GitHub Actions build and server-syntax verification

The original WebP files in the repository remain untouched and act as the visual reference set.

See `docs/PHASE_STATUS.md` for the evidence-based phase audit.

## Run locally

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and configure one AI authentication option.

### Option A — Vertex AI / service account

Set:

```text
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json
GEMINI_MODEL=gemini-2.5-flash
```

The server uses Google Application Default Credentials. Do not commit a service-account JSON file to this repository.

### Option B — Gemini API key

Set:

```text
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.5-flash
```

Run the content API in one terminal:

```bash
npm run api
```

Run the editor in another terminal:

```bash
npm run dev
```

Vite proxies `/api/*` requests to the local content API on port `8787`.

If the AI service is unavailable or not configured, generation automatically falls back to the deterministic local content engine and the UI labels the result as a fallback.

Production frontend build:

```bash
npm run build
npm run preview
```

## Current architecture

```text
server/
├── advisoryPrompt.js           # UK-English writing rules + strict response schema
├── geminiProvider.js           # Gemini / Vertex AI server-only provider
└── index.js                    # Content API + health endpoint

src/
├── components/
│   └── AdvisoryCanvas.jsx      # Vector artboard + three layouts
├── data/
│   └── references.js           # Existing advisory reference library
├── lib/
│   ├── advisoryEngine.js       # Local fallback, classification and template rules
│   ├── contentService.js       # AI-first client + validation + fallback
│   ├── exportAdvisory.js       # SVG and PNG export
│   └── qualityChecker.js       # Layout-specific content-fit validation
├── App.jsx                     # Generator/editor workspace
├── main.jsx
├── quality.css
└── styles.css
```

## Generation flow

```text
Topic + audience + advisory type
              ↓
      Server-side AI service
              ↓
      Strict JSON validation
              ↓
      AI success? ── no ──→ Local controlled fallback
              │
             yes
              ↓
   Structured advisory schema
              ↓
    Recommended composition
              ↓
       SVG design renderer
              ↓
      Live quality checker
              ↓
        Live content editor
              ↓
          SVG / PNG export
```

## AI writing rules

The Phase 2 prompt enforces the key advisory conventions:

- UK English
- Plain awareness-focused language
- Two to three short introductory sentences
- Exactly four explanatory/risk points
- Exactly four safety/best-practice points
- Similar visual length across bullets
- No invented client reporting addresses or internal policy details
- Audience-specific wording
- No unrestricted control over typography or placement

The browser never receives Gemini or Vertex AI credentials.

## Why the generator uses SVG

The advisory itself is rendered as structured vector artwork instead of asking an image model to create a complete poster. This keeps typography, spacing, colours and branding deterministic and allows the final SVG to be opened and edited in tools such as Adobe Illustrator.

AI image generation should later be used only for individual illustration assets where needed. Text and layout should remain controlled by the design engine.

## Phase roadmap

### Phase 1 — Design engine foundation

Foundation complete: editor, structured schema, SVG layouts, reference gallery and exports are implemented.

### Phase 2 — AI content service

Implementation complete in code. Production acceptance still requires a live configured Gemini or Vertex AI generation test. The local engine remains the fallback.

### Phase 3 — Deeper design intelligence

Partially implemented. Next add real text measurement, overflow detection, automatic title shortening, spacing validation and automatic template fallback.

### Phase 4 — Reference analysis

The reference gallery exists but the designs still need structured tagging by category, composition, illustration placement, text density and section structure. Those tags will rank visual families for new topics.

### Phase 5 — Illustration system

Build a reusable SVG asset library for devices, employees, attackers, banking, email, mobile, AI, privacy and security concepts. Compose scenes from approved vector assets rather than creating entire posters with generative images.

### Phase 6 — Client branding

Support multiple client brand profiles containing logo, colours, fonts and footer rules without changing the underlying advisory content.

### Phase 7 — Advanced editor

Add drag, resize, alignment guides, layers, element locking, undo/redo and asset replacement while preserving template safety rules.

### Phase 8 — Advanced quality assurance

Extend the current checker to score measured overflow, contrast, whitespace, alignment, logo safe area, asset quality and final export readiness.

## Design principle

The generator should behave like an art-directed design system:

**AI writes and classifies → approved layouts compose → vector assets illustrate → rules validate → user edits → professional export.**

The AI should not have unrestricted control of typography or placement.
