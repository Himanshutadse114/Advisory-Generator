const TEMPLATE_SPECS = {
  editorial: {
    title: { width: 610, fontSize: 62, weight: 800, maxLines: 3 },
    intro: { width: 615, fontSize: 24, weight: 400, maxLines: 4 },
    sectionHeading: { width: 350, fontSize: 28, weight: 800, maxLines: 1 },
    sectionOnePoint: { width: 335, fontSize: 20, weight: 400, maxLines: 3 },
    sectionTwoPoint: { width: 350, fontSize: 20, weight: 400, maxLines: 3 }
  },
  split: {
    title: { width: 315, fontSize: 58, weight: 800, maxLines: 4 },
    intro: { width: 315, fontSize: 23, weight: 400, maxLines: 7 },
    sectionHeading: { width: 500, fontSize: 30, weight: 800, maxLines: 1 },
    sectionOnePoint: { width: 478, fontSize: 22, weight: 400, maxLines: 3 },
    sectionTwoPoint: { width: 478, fontSize: 22, weight: 400, maxLines: 3 }
  },
  flow: {
    title: { width: 620, fontSize: 58, weight: 800, maxLines: 3 },
    intro: { width: 620, fontSize: 23, weight: 400, maxLines: 4 },
    sectionHeading: { width: 500, fontSize: 28, weight: 800, maxLines: 1 },
    sectionOnePoint: { width: 205, fontSize: 19, weight: 400, maxLines: 5 },
    sectionTwoPoint: { width: 388, fontSize: 18, weight: 400, maxLines: 3 }
  }
}

let measureContext = null

function getMeasureContext() {
  if (measureContext) return measureContext
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  measureContext = canvas.getContext('2d')
  return measureContext
}

function approximateWidth(text, fontSize, weight) {
  const factor = Number(weight) >= 700 ? 0.59 : 0.53
  return String(text || '').length * fontSize * factor
}

function measureWidth(text, spec) {
  const context = getMeasureContext()
  if (!context) return approximateWidth(text, spec.fontSize, spec.weight)

  context.font = `${spec.weight || 400} ${spec.fontSize}px Inter, Arial, sans-serif`
  return context.measureText(text).width
}

export function measureWrappedLines(text, spec) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const lines = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word

    if (measureWidth(candidate, spec) <= spec.width || !line) {
      line = candidate
      continue
    }

    lines.push(line)
    line = word
  }

  if (line) lines.push(line)
  return lines
}

function inspectField(value, spec, id, label) {
  const lines = measureWrappedLines(value, spec)
  const excessLines = Math.max(0, lines.length - spec.maxLines)

  return {
    id,
    label,
    lines: lines.length,
    maxLines: spec.maxLines,
    excessLines,
    overflow: excessLines > 0
  }
}

function inspectHeading(value, spec, id, label) {
  const width = measureWidth(value, spec)
  const overflow = width > spec.width

  return {
    id,
    label,
    lines: overflow ? 2 : 1,
    maxLines: 1,
    excessLines: overflow ? 1 : 0,
    overflow
  }
}

export function analyseTemplateFit(advisory, template = 'editorial') {
  const spec = TEMPLATE_SPECS[template] || TEMPLATE_SPECS.editorial
  const checks = [
    inspectField(advisory.title, spec.title, 'measured-title', 'Title exceeds the measured title area.'),
    inspectField(advisory.intro, spec.intro, 'measured-intro', 'Introduction exceeds the measured text area.'),
    inspectHeading(advisory.sectionOneTitle, spec.sectionHeading, 'measured-section-one-heading', 'First section heading is too wide for the layout.'),
    inspectHeading(advisory.sectionTwoTitle, spec.sectionHeading, 'measured-section-two-heading', 'Second section heading is too wide for the layout.')
  ]

  ;(advisory.sectionOnePoints || []).slice(0, 4).forEach((point, index) => {
    checks.push(inspectField(
      point,
      spec.sectionOnePoint,
      `measured-section-one-${index}`,
      `Section 1, point ${index + 1} exceeds its measured text area.`
    ))
  })

  ;(advisory.sectionTwoPoints || []).slice(0, 4).forEach((point, index) => {
    checks.push(inspectField(
      point,
      spec.sectionTwoPoint,
      `measured-section-two-${index}`,
      `Section 2, point ${index + 1} exceeds its measured text area.`
    ))
  })

  const overflows = checks.filter(check => check.overflow)
  const excessLines = overflows.reduce((sum, check) => sum + check.excessLines, 0)
  const score = Math.max(0, 100 - (overflows.length * 12) - (excessLines * 5))

  return {
    template,
    score,
    fits: overflows.length === 0,
    overflows,
    checks
  }
}

export function rankTemplatesByFit(advisory, preferredTemplate = 'editorial') {
  return Object.keys(TEMPLATE_SPECS)
    .map(template => {
      const fit = analyseTemplateFit(advisory, template)
      return {
        ...fit,
        preferred: template === preferredTemplate
      }
    })
    .sort((a, b) => {
      if (a.fits !== b.fits) return a.fits ? -1 : 1
      if (a.score !== b.score) return b.score - a.score
      if (a.preferred !== b.preferred) return a.preferred ? -1 : 1
      return 0
    })
}

export function getBestFitTemplate(advisory, preferredTemplate = 'editorial') {
  return rankTemplatesByFit(advisory, preferredTemplate)[0]?.template || preferredTemplate
}

export function getTemplateFitSpecs() {
  return TEMPLATE_SPECS
}
