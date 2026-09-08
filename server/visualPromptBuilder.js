const SIMILARITY_GUIDANCE = {
  low: 'Use the reference only as loose art direction. Create a noticeably fresh composition while preserving the same overall corporate design language.',
  medium: 'Keep the same design family, visual hierarchy, illustration polish, spacing rhythm and brand mood while creating a fresh composition rather than copying the layout.',
  high: 'Stay very close to the reference visual language, hierarchy, spacing, illustration treatment and overall balance, but do not reproduce the exact layout or reuse the original text.'
}

const CONCEPT_GUIDANCE = {
  balanced: 'Create a balanced corporate awareness poster with a strong hero visual and clearly separated information sections.',
  illustration: 'Make the hero illustration the strongest visual element while keeping the advisory copy readable and professionally organised.',
  infographic: 'Use a more infographic-led composition with visual cues, numbered steps and compact supporting illustration.',
  scenario: 'Use a realistic cybersecurity scenario as the main visual storytelling device, supported by concise advisory sections.'
}

function quote(value) {
  return `“${String(value || '').replace(/[“”]/g, '"').trim()}”`
}

function numbered(points) {
  return points.map((point, index) => `${index + 1}. ${point}`).join('\n')
}

export function buildReferenceAdvisoryPrompt({ advisory, reference, similarity = 'medium', concept = 'balanced' }) {
  return `Create a NEW, complete cybersecurity awareness advisory poster using the supplied advisory image as a visual reference.

IMPORTANT DESIGN DIRECTION
- This must look as though the same professional designer or design team created it.
- ${SIMILARITY_GUIDANCE[similarity] || SIMILARITY_GUIDANCE.medium}
- ${CONCEPT_GUIDANCE[concept] || CONCEPT_GUIDANCE.balanced}
- Preserve the reference's polished corporate feel, clean whitespace, visual hierarchy, illustration quality, disciplined spacing and professional cybersecurity-awareness aesthetic.
- Do NOT copy the original advisory word-for-word.
- Do NOT simply edit a few words in the supplied image. Re-compose the advisory for the new topic.
- Keep a clean, client-ready finish suitable for corporate distribution and LinkedIn.
- Avoid generic AI-art poster styling, excessive glow, cyberpunk neon, clutter, random decorative text or stock-photo aesthetics.
- Keep text upright, sharp, correctly spelled and easy to read.
- Render the following wording as faithfully as possible. Do not invent additional claims, URLs, phone numbers, email addresses or company policies.

NEW ADVISORY CONTENT
Title: ${quote(advisory.title)}
Introduction: ${quote(advisory.intro)}

${advisory.sectionOneTitle}:
${numbered(advisory.sectionOnePoints)}

${advisory.sectionTwoTitle}:
${numbered(advisory.sectionTwoPoints)}

REFERENCE CONTEXT
Reference topic: ${reference.title}
Reference category: ${reference.category}
Reference visual family: ${reference.visualFamily}

OUTPUT REQUIREMENTS
- Generate one finished vertical advisory poster.
- Match the input image aspect ratio.
- Maintain professional margins and readable information hierarchy.
- Use a fresh hero illustration that clearly represents ${advisory.title}.
- Keep the visual style consistent with the supplied reference, but make the scene and composition appropriate to the new topic.
- Do not add watermarks or placeholder text.`
}
