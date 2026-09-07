# Innvikta Advisory Generator

A controlled AI-assisted design studio for creating polished cybersecurity awareness advisories as editable vector artwork.

The generator is intentionally not an unrestricted AI poster tool. AI creates structured advisory copy, approved reference artwork directs the visual treatment, deterministic layouts control typography and spacing, reusable SVG scenes provide illustration and a quality gate protects the final export.

## Status

All eight planned product phases are implemented in `main`:

1. Design engine foundation
2. AI content service
3. Design intelligence
4. Reference intelligence
5. Vector illustration system
6. Client branding
7. Advanced editor
8. Quality assurance

See `docs/PHASE_STATUS.md` for the detailed acceptance matrix.

## Main capabilities

- React + Vite advisory design studio
- Server-side Gemini / Vertex AI generation
- Strict 4 + 4 advisory JSON structure
- UK-English awareness writing rules
- Deterministic local fallback when AI is unavailable
- Three approved vector compositions: Editorial Hero, Split Story and Threat Flow
- Measured text fitting and automatic layout selection
- Automatic copy tightening when content does not fit safely
- 25 approved advisory references with structured visual metadata
- Topic-aware reference ranking and art direction
- Reusable SVG illustration scenes for major cybersecurity categories
- Direct layer selection and dragging
- Layer X/Y, scaling, visibility and locking
- Undo / redo
- Grid snapping and alignment guides
- Client brand presets and custom branding
- Custom logo embedding
- Contrast, overflow, safe-zone, scale and collision checks
- Export gating when blocking design issues exist
- Clean SVG export for Illustrator editing
- High-resolution PNG export
- Print-sized SVG export
- GitHub Actions verification

## How generation works

```text
Topic + audience + advisory type
              ↓
      Gemini / Vertex AI
              ↓
       Strict JSON schema
              ↓
  Invalid/unavailable? ──→ Local controlled fallback
              ↓
      Reference ranking
              ↓
   Visual family + layout direction
              ↓
      Measured layout fit
              ↓
      Copy tightening if needed
              ↓
      Reusable SVG scene
              ↓
        Client branding
              ↓
      Advanced layer editor
              ↓
        Quality assurance
              ↓
      SVG / PNG / Print SVG
```

## Run locally

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and configure an AI provider if live AI generation is required.

### Vertex AI / service account

```text
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json
GEMINI_MODEL=gemini-2.5-flash
```

Use Google Application Default Credentials and keep the service-account file outside this repository.

### Gemini API key

```text
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.5-flash
```

Start the content API:

```bash
npm run api
```

Start the editor in another terminal:

```bash
npm run dev
```

Vite proxies `/api/*` to the local API server on port `8787`.

Without credentials the application remains fully usable and generation automatically switches to the deterministic local advisory engine.

## Verification

Run the complete repository verification:

```bash
npm run verify
```

This runs phase-level logic assertions followed by the production Vite build.

Individual commands:

```bash
npm run verify:logic
npm run build
```

GitHub Actions runs dependency installation, server syntax checks, phase logic checks and the frontend production build on every push to `main` and on pull requests.

A live third-party Gemini/Vertex request is a deployment acceptance check because production credentials are intentionally not committed to GitHub.

## Architecture

```text
server/
├── advisoryPrompt.js            # UK-English rules + strict AI schema
├── geminiProvider.js            # Gemini / Vertex AI provider
└── index.js                     # Content API + health endpoint

scripts/
└── verify-phases.mjs            # Cross-phase logic acceptance tests

src/
├── components/
│   ├── AdvisoryCanvas.jsx       # Layered SVG renderer/editor canvas
│   └── IllustrationLibrary.jsx  # Reusable cybersecurity SVG scenes
│
├── data/
│   ├── brands.js                # Brand profiles and custom branding
│   └── references.js            # 25 tagged approved advisories
│
├── hooks/
│   └── useDocumentHistory.js    # Undo / redo history
│
├── lib/
│   ├── advisoryEngine.js        # Local fallback and classification
│   ├── contentService.js        # AI-first client + schema validation
│   ├── designIntelligence.js    # Measurement, fitting and copy tightening
│   ├── editorState.js           # Production layer state
│   ├── exportAdvisory.js        # SVG / PNG / Print SVG export
│   ├── qualityChecker.js        # Content, brand and geometry QA
│   └── referenceIntelligence.js # Reference matching and art direction
│
├── App.jsx                      # Full design studio
├── advanced-editor.css
├── quality.css
├── styles.css
└── main.jsx
```

## Reference intelligence

Each approved WebP reference in the repository is tagged with:

- cybersecurity category
- visual family
- recommended layout
- information density
- illustration position
- topic keywords
- section structure

The generator ranks those references against the current topic and uses the strongest matches to recommend the illustration family and initial composition. The user can still override the result from the Design panel.

## Vector illustration system

The artwork is built from reusable vector primitives and scenes rather than asking an image model to generate the complete advisory. Current scene families include:

- phishing and messaging
- identity and authentication
- financial fraud
- malware and device security
- social engineering
- data and privacy
- network security
- AI and emerging technology
- general cybersecurity

This keeps typography and branding deterministic while still giving different threats distinct visual treatments.

## Client branding

Brand profiles control:

- primary and secondary colours
- text and background colours
- soft panel and line colours
- typography stack
- footer wording
- logo text
- uploaded logo artwork

Uploaded logos are embedded directly in the exported vector artwork so the final file does not depend on an external URL.

## Advanced editor

The production layers are:

- Header
- Title
- Introduction
- Illustration
- How It Works
- Best Practices
- Footer

Users can select layers directly on the artboard or through the layer panel, drag unlocked layers, set X/Y coordinates, resize scalable layers, hide/show them, lock them, undo/redo changes and reset individual or complete layouts. Header and footer are protected by default.

## Quality assurance

Export readiness combines:

- required content
- exactly four points in each advisory section
- measured text overflow
- approved layer scale range
- canvas safe-zone checks
- required-layer visibility
- known layer collisions
- body-text contrast
- accent contrast warnings
- inverse panel contrast

Blocking errors disable export until the advisory is corrected.

## Illustrator workflow

SVG is the design master. The file can be opened in Adobe Illustrator for final designer adjustments while retaining vector text and shapes. PNG is available for direct distribution and the print SVG provides a physical-size version for production workflows.

## Design principle

**AI writes → references direct → approved layouts compose → vectors illustrate → brand rules apply → user edits → QA validates → professional export.**

The AI never has unrestricted control over final typography, placement or branding.
