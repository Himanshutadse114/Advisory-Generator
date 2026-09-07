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

The application also includes a protected Admin panel for managing Gemini credentials without committing API keys to GitHub.

See `docs/PHASE_STATUS.md` for the detailed acceptance matrix.

## Main capabilities

- React + Vite advisory design studio
- Server-side Gemini / Vertex AI generation
- Protected Admin settings panel
- AES-256-GCM encrypted Gemini API-key storage
- HttpOnly admin sessions and rate-limited login attempts
- Gemini text and image model configuration from the Admin panel
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

## Admin-managed Gemini API key

The Admin tab allows an authorised administrator to add or replace the Gemini API key from the browser without storing it in frontend code or Git.

### Initial server setup

Set an admin password in the deployment environment:

```text
ADMIN_PASSWORD=use-a-long-unique-password
```

Optionally use a separate encryption secret:

```text
ADMIN_ENCRYPTION_SECRET=use-another-long-random-secret
```

If `ADMIN_ENCRYPTION_SECRET` is omitted, the admin password is used to derive the encryption key.

Then open the **Admin** tab in the application, sign in and paste the Gemini API key. The application stores only encrypted ciphertext on disk and displays the key later only as a masked suffix such as `••••••••abcd`.

The runtime Admin key takes priority over environment-based Gemini credentials. Removing it returns the application to the configured Vertex AI or `GEMINI_API_KEY` environment fallback.

### Persistent storage on Render or similar hosts

The encrypted runtime key is stored at `data/runtime-secrets.json` by default. This file is excluded from Git.

On hosts with ephemeral filesystems, attach a persistent disk and set:

```text
ADVISORY_DATA_DIR=/your/persistent/disk/path
```

Without a persistent disk the key can disappear after a redeploy or instance replacement.

## Run locally

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env`.

For Admin-managed credentials, set at minimum:

```text
ADMIN_PASSWORD=your-long-admin-password
```

You can still configure Vertex AI directly:

```text
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json
GEMINI_MODEL=gemini-2.5-flash
```

Or use an environment Gemini API key fallback:

```text
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
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

Without credentials the application remains usable and content generation automatically switches to the deterministic local advisory engine.

## Verification

Run complete repository verification:

```bash
npm run verify
```

This verifies phase logic, encrypted Admin credential storage and the production Vite build.

Individual commands:

```bash
npm run verify:logic
npm run verify:admin
npm run build
```

The Admin security test saves a test API key, verifies that the encrypted file does not contain the plaintext key, verifies decryption and validates session creation/destruction.

GitHub Actions runs dependency installation, server syntax checks, phase logic checks, Admin security checks and the frontend production build on every push to `main` and on pull requests.

A live third-party Gemini/Vertex request remains a deployment acceptance check because production credentials are intentionally not committed to GitHub.

## Architecture

```text
server/
├── adminAuth.js                 # Admin login, session and rate limiting
├── advisoryPrompt.js            # UK-English rules + strict AI schema
├── geminiProvider.js            # Gemini / Vertex AI provider + runtime Admin override
├── secretStore.js               # AES-256-GCM runtime secret storage
└── index.js                     # Content, health and protected Admin API

scripts/
├── verify-admin-security.mjs    # Secret encryption + session security checks
└── verify-phases.mjs            # Cross-phase logic acceptance tests

src/
├── components/
│   ├── AdminPanel.jsx           # Protected Gemini credential UI
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
├── admin.css
├── advanced-editor.css
├── quality.css
├── styles.css
└── main.jsx
```

## Credential security model

The Admin system intentionally does not expose the saved API key after it is written.

- Admin access requires `ADMIN_PASSWORD`.
- Login attempts are rate limited.
- Successful login creates an HttpOnly SameSite=Strict session cookie.
- Sensitive settings writes require both a valid session and an Admin request header.
- The Gemini key is encrypted with AES-256-GCM before disk storage.
- The encryption key is derived with `scrypt` from `ADMIN_ENCRYPTION_SECRET` or `ADMIN_PASSWORD`.
- Runtime secret files are ignored by Git.
- API responses expose only the final four key characters.
- In production the Admin session cookie is marked `Secure`.

## Reference intelligence

Each approved WebP reference in the repository is tagged with cybersecurity category, visual family, recommended layout, information density, illustration position, topic keywords and section structure.

The generator ranks those references against the current topic and uses the strongest matches to recommend the illustration family and initial composition. The user can still override the result from the Design panel.

## Vector illustration system

The artwork is built from reusable vector primitives and scenes rather than asking an image model to generate the complete advisory. Current scene families include phishing and messaging, identity and authentication, financial fraud, malware and device security, social engineering, data and privacy, network security, AI and emerging technology and general cybersecurity.

The Admin panel already stores a separate Gemini image-model setting so generated hero artwork can be connected to the same secure provider configuration.

## Client branding

Brand profiles control primary and secondary colours, text and background colours, soft panel and line colours, typography stack, footer wording, logo text and uploaded logo artwork. Uploaded logos are embedded directly in the exported vector artwork so the final file does not depend on an external URL.

## Advanced editor

The production layers are Header, Title, Introduction, Illustration, How It Works, Best Practices and Footer. Users can select layers directly on the artboard or through the layer panel, drag unlocked layers, set X/Y coordinates, resize scalable layers, hide/show them, lock them, undo/redo changes and reset individual or complete layouts. Header and footer are protected by default.

## Quality assurance

Export readiness combines required content, exactly four points in each advisory section, measured text overflow, approved layer scale range, canvas safe-zone checks, required-layer visibility, known layer collisions, body-text contrast, accent contrast warnings and inverse panel contrast. Blocking errors disable export until the advisory is corrected.

## Illustrator workflow

SVG is the design master. The file can be opened in Adobe Illustrator for final designer adjustments while retaining vector text and shapes. PNG is available for direct distribution and the print SVG provides a physical-size version for production workflows.
