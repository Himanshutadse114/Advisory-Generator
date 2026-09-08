const SIMILARITY_GUIDANCE = {
  low: 'Use the references as loose art direction. Create a noticeably fresh composition while preserving the same overall corporate design language.',
  medium: 'Keep the same design family, visual hierarchy, spacing rhythm, illustration polish and brand mood while creating a fresh composition rather than copying a layout.',
  high: 'Stay very close to the reference visual language, hierarchy, spacing, illustration treatment and overall balance, but do not reproduce an exact layout or reuse old wording.'
}

const CONCEPT_GUIDANCE = {
  balanced: 'Create a balanced corporate awareness poster with one strong hero visual and clearly separated information sections.',
  illustration: 'Make the hero illustration the strongest visual element while keeping every line of advisory copy easy to read.',
  infographic: 'Use an infographic-led composition with restrained visual cues and compact, readable information groups.',
  scenario: 'Use a realistic cybersecurity scenario as the main visual storytelling device, supported by concise advisory sections.'
}

function clean(value) {
  return String(value || '').replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()
}

function exact(value) {
  return `"${clean(value).replace(/"/g, '\\"')}"`
}

function exactPoints(points) {
  return points.map((point, index) => `${index + 1}. ${exact(point)}`).join('\n')
}

export function buildReferenceAdvisoryPrompt({ advisory, reference, references = [], similarity = 'medium', concept = 'balanced' }) {
  const styleReferences = references.length ? references : [reference]
  const referenceList = styleReferences
    .filter(Boolean)
    .map((item, index) => `Reference image ${index + 1}: ${item.title} · ${item.category} · ${item.visualFamily}`)
    .join('\n')

  return `Create one NEW, finished cybersecurity awareness advisory poster.

ROLE OF THE INPUT IMAGES
- The supplied images are APPROVED STYLE REFERENCES, not canvases to edit literally.
- Study their professional layout language, warm corporate palette, use of whitespace, hierarchy, illustration treatment, section rhythm, icon treatment and balanced density.
- ${SIMILARITY_GUIDANCE[similarity] || SIMILARITY_GUIDANCE.medium}
- ${CONCEPT_GUIDANCE[concept] || CONCEPT_GUIDANCE.balanced}
- Create a fresh composition for the new topic. Do not trace, duplicate or merely replace text in a reference.
- Do not reproduce an exact reference layout.
- Do not drift into dark cyberpunk, neon-blue hacker art, generic AI poster styling, excessive glow, clutter or stock-photo aesthetics unless that treatment is genuinely present in the references.
- The output must feel like another piece from the same professional advisory design series.

TEXT ACCURACY IS A HARD REQUIREMENT
Render ONLY the text in the manifest below. Reproduce every quoted string exactly, character-for-character.
- Do not paraphrase, shorten, expand or invent any text.
- Do not create filler words, pseudo-text, gibberish or decorative letters.
- If space is tight, reduce body font size slightly or allocate more whitespace. Never corrupt spelling to make text fit.
- Keep body copy horizontal, sharp, high contrast and comfortably readable.
- Use a clean professional sans-serif typeface with clear hierarchy.
- Do not add URLs, phone numbers, email addresses, company policies, watermarks or placeholder text.

EXACT TEXT MANIFEST
TITLE
${exact(advisory.title)}

INTRODUCTION
${exact(advisory.intro)}

SECTION 1 HEADING
${exact(advisory.sectionOneTitle)}
SECTION 1 POINTS
${exactPoints(advisory.sectionOnePoints)}

SECTION 2 HEADING
${exact(advisory.sectionTwoTitle)}
SECTION 2 POINTS
${exactPoints(advisory.sectionTwoPoints)}

VISUAL CONTENT
- Create one polished hero illustration or scenario that clearly communicates ${exact(advisory.title)}.
- Supporting icons should be simple, consistent and relevant to the actual points.
- Keep the design corporate, approachable and suitable for employee awareness distribution and LinkedIn.
- Preserve generous margins and breathing room. Do not overcrowd the poster.
- Prefer a light or neutral information area for body copy unless the supplied references strongly indicate otherwise.

REFERENCE CONTEXT
${referenceList}

OUTPUT
- One complete vertical advisory poster.
- 2:3 portrait composition.
- Production-quality graphic design.
- All text must be real, readable English from the exact manifest above.
- No additional copy beyond the manifest.`
}
