# Innvikta Advisory Generator

A controlled advisory design engine for creating polished cybersecurity awareness advisories from structured content and reusable visual layouts.

## Current status

The repository now contains the first working generator foundation:

- React + Vite editor
- Structured advisory content engine
- Topic classification for common cybersecurity themes
- Three vector-safe advisory layouts
- Live editable title, introduction and guidance points
- Existing WebP advisories exposed as the reference library
- SVG export
- High-resolution PNG export
- Innvikta design tokens separated from generation logic

The original WebP files in the repository remain untouched and act as the visual reference set.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Current architecture

```text
src/
├── components/
│   └── AdvisoryCanvas.jsx      # Vector artboard + three layouts
├── data/
│   └── references.js           # Existing advisory reference library
├── lib/
│   ├── advisoryEngine.js       # Content schema, classification and copy rules
│   └── exportAdvisory.js       # SVG and PNG export
├── App.jsx                     # Generator/editor workspace
├── main.jsx
└── styles.css
```

## Generation flow

```text
Topic + audience + advisory type
              ↓
       Topic classifier
              ↓
   Structured advisory schema
              ↓
    Recommended composition
              ↓
       SVG design renderer
              ↓
        Live content editor
              ↓
          SVG / PNG export
```

## Why the generator uses SVG

The advisory itself is rendered as structured vector artwork instead of asking an image model to create a complete poster. This keeps typography, spacing, colours and branding deterministic and allows the final SVG to be opened and edited in tools such as Adobe Illustrator.

AI image generation should later be used only for individual illustration assets where needed. Text and layout should remain controlled by the design engine.

## Next implementation phases

### Phase 2 — AI content service

Replace or augment the current local rule engine with a backend AI service that returns the exact existing advisory schema. Keep the local engine as a fallback and test fixture.

### Phase 3 — Design intelligence

Add text-fit measurement, overflow detection, spacing validation, title shortening and automatic template fallback.

### Phase 4 — Reference analysis

Tag the existing advisory library by category, composition, illustration placement, text density and section structure. Use those tags to rank layouts for new topics.

### Phase 5 — Illustration system

Add a reusable SVG asset library for devices, employees, attackers, banking, email, mobile, AI, privacy and security concepts. Compose scenes from approved vector assets rather than creating entire posters with generative images.

### Phase 6 — Client branding

Support multiple client brand profiles containing logo, colours, fonts and footer rules without changing the underlying advisory content.

### Phase 7 — Advanced editor

Add drag, resize, alignment guides, layers, element locking, undo/redo and asset replacement while preserving template safety rules.

### Phase 8 — Quality checker

Score generated advisories for overflow, contrast, whitespace, alignment, logo safe area and content density before export.

## Design principle

The generator should behave like an art-directed design system:

**AI writes and classifies → approved layouts compose → vector assets illustrate → rules validate → user edits → professional export.**

The AI should not have unrestricted control of typography or placement.
