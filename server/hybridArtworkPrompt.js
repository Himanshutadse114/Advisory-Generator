function box(label, value) {
  return `${label}: x=${Math.round(value.x)}, y=${Math.round(value.y)}, width=${Math.round(value.w)}, height=${Math.round(value.h)}`
}

export function buildHybridArtworkPrompt({ advisory, blueprint, references, similarity = 'medium', concept = 'balanced' }) {
  const referenceList = references.map((item, index) => `Reference ${index + 1}: ${item.title} (${item.category}, ${item.visualFamily})`).join('\n')
  const l = blueprint.layers

  return `Create the VISUAL ARTWORK LAYER for a professional cybersecurity advisory about "${advisory.title}".

IMPORTANT: DO NOT RENDER ANY WORDS, LETTERS, NUMBERS, LABELS, LOGOS OR PLACEHOLDER TEXT. The application will add all typography later as editable vector text.

Use the supplied advisory images only as approved visual-style references. Create a fresh composition that belongs to the same design series. Do not copy an exact layout or scene.

Reference guidance:\n${referenceList}
Similarity preference: ${similarity}
Creative direction: ${concept}

CANVAS AND RESERVED TEXT ZONES
The final editable canvas is 1080 x 1620 portrait. Keep these regions visually quiet and readable because editable text will be placed over them:
- ${box('Title safe zone', l.title)}
- ${box('Introduction safe zone', l.intro)}
- ${box('Section one safe zone', l.sectionOne)}
- ${box('Section two safe zone', l.sectionTwo)}
- ${box('Footer safe zone', l.footer)}

HERO ART ZONE
- ${box('Hero zone', l.hero)}
Create the strongest visual storytelling in or around this area. The imagery must clearly communicate the topic "${advisory.title}" without using text.

DESIGN DIRECTION
- Corporate cybersecurity awareness, polished editorial illustration, clean and client-ready.
- Follow the reference series' visual language, spacing rhythm, illustration treatment and restrained colour use.
- Use palette cues close to: paper ${blueprint.palette.paper}, accent ${blueprint.palette.accent}, soft ${blueprint.palette.soft}, ink ${blueprint.palette.ink}.
- Maintain generous whitespace and clear visual hierarchy.
- Avoid dark hacker clichés, neon cyberpunk, excessive glow, random code, stock-photo look or clutter unless genuinely supported by the references.
- Supporting decorative shapes and icons are allowed only if they are meaningful and do not contain text.
- Do not place important artwork behind the reserved text zones.
- No watermark.

OUTPUT
One complete 2:3 portrait background/artwork layer with no text at all. It should look finished even before typography is added, but leave the reserved areas clean enough for readable editable copy.`
}
