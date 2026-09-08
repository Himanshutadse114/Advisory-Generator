const CANVAS = { width: 1080, height: 1620 }

const FALLBACKS = {
  split: {
    title: { x: 72, y: 76, w: 936, h: 130, fontSize: 62, align: 'left' },
    intro: { x: 72, y: 220, w: 430, h: 220, fontSize: 24, align: 'left' },
    hero: { x: 530, y: 205, w: 478, h: 455 },
    sectionOne: { x: 72, y: 690, w: 444, h: 650 },
    sectionTwo: { x: 564, y: 690, w: 444, h: 650 },
    footer: { x: 72, y: 1482, w: 936, h: 70 }
  },
  flow: {
    title: { x: 72, y: 70, w: 936, h: 130, fontSize: 60, align: 'left' },
    intro: { x: 72, y: 214, w: 520, h: 200, fontSize: 23, align: 'left' },
    hero: { x: 610, y: 205, w: 398, h: 390 },
    sectionOne: { x: 72, y: 626, w: 936, h: 385 },
    sectionTwo: { x: 72, y: 1040, w: 936, h: 335 },
    footer: { x: 72, y: 1482, w: 936, h: 70 }
  },
  editorial: {
    title: { x: 72, y: 74, w: 936, h: 126, fontSize: 61, align: 'left' },
    intro: { x: 72, y: 218, w: 500, h: 210, fontSize: 23, align: 'left' },
    hero: { x: 590, y: 205, w: 418, h: 470 },
    sectionOne: { x: 72, y: 704, w: 936, h: 300 },
    sectionTwo: { x: 72, y: 1028, w: 936, h: 340 },
    footer: { x: 72, y: 1482, w: 936, h: 70 }
  }
}

function clamp(value, min, max, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

function safeHex(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback
}

function normaliseBox(box, fallback, { text = false } = {}) {
  const result = {
    x: clamp(box?.x, 24, CANVAS.width - 80, fallback.x),
    y: clamp(box?.y, 24, CANVAS.height - 80, fallback.y),
    w: clamp(box?.w, 140, CANVAS.width - 48, fallback.w),
    h: clamp(box?.h, 60, CANVAS.height - 48, fallback.h)
  }
  if (result.x + result.w > CANVAS.width - 24) result.w = CANVAS.width - 24 - result.x
  if (result.y + result.h > CANVAS.height - 24) result.h = CANVAS.height - 24 - result.y
  if (text) {
    result.fontSize = clamp(box?.fontSize, 16, 80, fallback.fontSize || 24)
    result.align = ['left', 'center', 'right'].includes(box?.align) ? box.align : (fallback.align || 'left')
  }
  return result
}

export function createFallbackBlueprint(reference = {}) {
  const family = FALLBACKS[reference.suggestedTemplate] ? reference.suggestedTemplate : 'split'
  const base = FALLBACKS[family]
  return {
    version: 1,
    canvas: { ...CANVAS },
    composition: family,
    palette: {
      paper: '#FFF9F2',
      ink: '#1E1B18',
      accent: '#F28A3A',
      soft: '#F5E9DC',
      line: '#D9CDC2'
    },
    typography: { family: 'Inter, Arial, sans-serif', bodySize: 22, sectionHeadingSize: 30 },
    layers: JSON.parse(JSON.stringify(base)),
    decoration: { cornerRadius: 28, sectionStyle: 'soft-panels', density: reference.density || 'medium' }
  }
}

export function normaliseBlueprint(raw, reference = {}) {
  const fallback = createFallbackBlueprint(reference)
  const layers = raw?.layers || {}
  return {
    version: 1,
    canvas: { ...CANVAS },
    composition: ['split', 'flow', 'editorial', 'asymmetric'].includes(raw?.composition) ? raw.composition : fallback.composition,
    palette: {
      paper: safeHex(raw?.palette?.paper, fallback.palette.paper),
      ink: safeHex(raw?.palette?.ink, fallback.palette.ink),
      accent: safeHex(raw?.palette?.accent, fallback.palette.accent),
      soft: safeHex(raw?.palette?.soft, fallback.palette.soft),
      line: safeHex(raw?.palette?.line, fallback.palette.line)
    },
    typography: {
      family: typeof raw?.typography?.family === 'string' && raw.typography.family.length < 100 ? raw.typography.family : fallback.typography.family,
      bodySize: clamp(raw?.typography?.bodySize, 17, 30, fallback.typography.bodySize),
      sectionHeadingSize: clamp(raw?.typography?.sectionHeadingSize, 22, 42, fallback.typography.sectionHeadingSize)
    },
    layers: {
      title: normaliseBox(layers.title, fallback.layers.title, { text: true }),
      intro: normaliseBox(layers.intro, fallback.layers.intro, { text: true }),
      hero: normaliseBox(layers.hero, fallback.layers.hero),
      sectionOne: normaliseBox(layers.sectionOne, fallback.layers.sectionOne),
      sectionTwo: normaliseBox(layers.sectionTwo, fallback.layers.sectionTwo),
      footer: normaliseBox(layers.footer, fallback.layers.footer)
    },
    decoration: {
      cornerRadius: clamp(raw?.decoration?.cornerRadius, 0, 64, fallback.decoration.cornerRadius),
      sectionStyle: ['soft-panels', 'open', 'cards', 'numbered'].includes(raw?.decoration?.sectionStyle) ? raw.decoration.sectionStyle : fallback.decoration.sectionStyle,
      density: ['light', 'medium', 'dense'].includes(raw?.decoration?.density) ? raw.decoration.density : fallback.decoration.density
    }
  }
}

export function buildLayoutBlueprintPrompt({ advisory, references, similarity = 'medium', concept = 'balanced' }) {
  const refSummary = references.map((item, index) => `${index + 1}. ${item.title}; ${item.visualFamily}; ${item.suggestedTemplate}; ${item.density}; illustration ${item.illustrationPosition}`).join('\n')
  return `Act as a senior editorial graphic designer. Plan a fresh editable cybersecurity advisory layout on a 1080 x 1620 portrait canvas.

The actual text and artwork will be rendered later as separate editable layers. Return layout coordinates only.

Topic: ${advisory.title}
Category: ${advisory.category}
Similarity preference: ${similarity}
Creative direction: ${concept}
Approved reference metadata:\n${refSummary}

Design goals:
- Feel like the same professional advisory series without copying an exact reference layout.
- Strong visual hierarchy, generous whitespace and balanced editorial composition.
- Reserve one clear hero-art area and two readable information sections.
- Title must be prominent but never dominate more than roughly 12% of canvas height.
- Keep all boxes inside 24px safe margins and do not overlap title, intro, hero, sections or footer.
- Leave enough room for exactly four concise points in each section.
- Prefer warm corporate neutrals and one restrained accent colour.

Return ONLY JSON with exactly this shape:
{
  "composition": "split|flow|editorial|asymmetric",
  "palette": {"paper":"#RRGGBB","ink":"#RRGGBB","accent":"#RRGGBB","soft":"#RRGGBB","line":"#RRGGBB"},
  "typography": {"family":"Inter, Arial, sans-serif","bodySize":22,"sectionHeadingSize":30},
  "layers": {
    "title":{"x":72,"y":70,"w":936,"h":130,"fontSize":60,"align":"left"},
    "intro":{"x":72,"y":215,"w":460,"h":210,"fontSize":23,"align":"left"},
    "hero":{"x":560,"y":205,"w":448,"h":450},
    "sectionOne":{"x":72,"y":690,"w":444,"h":650},
    "sectionTwo":{"x":564,"y":690,"w":444,"h":650},
    "footer":{"x":72,"y":1482,"w":936,"h":70}
  },
  "decoration":{"cornerRadius":28,"sectionStyle":"soft-panels|open|cards|numbered","density":"light|medium|dense"}
}`
}

export const HYBRID_CANVAS = CANVAS
