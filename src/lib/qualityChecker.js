import { analyseTemplateFit } from './designIntelligence.js'
import { getBrandProfile } from '../data/brands.js'

function issue(id, label, severity = 'warning', group = 'content') { return { id, label, severity, group } }

const LAYOUT_BOXES = {
  editorial: {
    header: [0, 0, 1080, 105], title: [65, 120, 625, 190], intro: [65, 320, 630, 170], illustration: [715, 110, 330, 330],
    sectionOne: [65, 575, 460, 625], sectionTwo: [532, 575, 485, 625], footer: [65, 1260, 950, 80]
  },
  split: {
    header: [0, 0, 1080, 105], title: [65, 125, 335, 265], intro: [65, 395, 335, 245], illustration: [55, 640, 350, 350],
    sectionOne: [485, 145, 530, 460], sectionTwo: [485, 645, 530, 470], footer: [65, 1260, 950, 80]
  },
  flow: {
    header: [0, 0, 1080, 105], title: [65, 120, 635, 190], intro: [65, 315, 635, 175], illustration: [725, 105, 340, 330],
    sectionOne: [65, 500, 950, 345], sectionTwo: [65, 880, 950, 315], footer: [65, 1260, 950, 80]
  }
}

const COLLISION_PAIRS = [
  ['header', 'title'], ['header', 'illustration'], ['title', 'intro'], ['title', 'illustration'], ['intro', 'illustration'],
  ['intro', 'sectionOne'], ['sectionOne', 'sectionTwo'], ['sectionOne', 'footer'], ['sectionTwo', 'footer']
]

function transformedBox(box, layer = {}) {
  const [x, y, width, height] = box
  const scale = Number(layer.scale || 1)
  const cx = x + width / 2
  const cy = y + height / 2
  return {
    x: cx - (width * scale) / 2 + Number(layer.x || 0),
    y: cy - (height * scale) / 2 + Number(layer.y || 0),
    width: width * scale,
    height: height * scale
  }
}

function intersects(a, b, tolerance = 10) {
  return a.x + a.width - tolerance > b.x && b.x + b.width - tolerance > a.x && a.y + a.height - tolerance > b.y && b.y + b.height - tolerance > a.y
}

function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) return null
  return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) }
}

function luminance(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const channels = [rgb.r, rgb.g, rgb.b].map(value => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

export function contrastRatio(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

function inspectVisualGeometry(template, editor) {
  const issues = []
  const source = LAYOUT_BOXES[template] || LAYOUT_BOXES.editorial
  const boxes = {}

  Object.entries(source).forEach(([id, box]) => {
    const layer = editor?.layers?.[id] || {}
    if (layer.visible === false) return
    const transformed = transformedBox(box, layer)
    boxes[id] = transformed

    if (transformed.x < -12 || transformed.y < -12 || transformed.x + transformed.width > 1092 || transformed.y + transformed.height > 1362) {
      issues.push(issue(`safe-zone-${id}`, `${id} has moved outside the canvas safe area.`, 'error', 'geometry'))
    }
    if ((layer.scale || 1) < 0.72 || (layer.scale || 1) > 1.35) {
      issues.push(issue(`scale-${id}`, `${id} scale is outside the approved 72–135% range.`, 'error', 'geometry'))
    }
  })

  COLLISION_PAIRS.forEach(([first, second]) => {
    if (boxes[first] && boxes[second] && intersects(boxes[first], boxes[second])) {
      issues.push(issue(`collision-${first}-${second}`, `${first} overlaps ${second}. Reposition or reset the layer.`, 'error', 'geometry'))
    }
  })

  ;['header', 'title', 'intro', 'sectionOne', 'sectionTwo', 'footer'].forEach(id => {
    if (editor?.layers?.[id]?.visible === false) issues.push(issue(`hidden-${id}`, `${id} is hidden but required for a complete advisory.`, 'error', 'geometry'))
  })

  return { issues, boxes }
}

function inspectBrand(brand) {
  const issues = []
  const bodyContrast = contrastRatio(brand.ink, brand.paper)
  const accentContrast = contrastRatio(brand.primary, brand.paper)
  const inverseContrast = contrastRatio('#FFFFFF', brand.ink)

  if (bodyContrast < 4.5) issues.push(issue('contrast-body', 'Body text contrast is below the 4.5:1 accessibility target.', 'error', 'brand'))
  if (accentContrast < 3) issues.push(issue('contrast-accent', 'Primary accent contrast is low on the advisory background.', 'warning', 'brand'))
  if (inverseContrast < 4.5) issues.push(issue('contrast-inverse', 'Light text on the dark best-practice panel has insufficient contrast.', 'error', 'brand'))

  return { issues, bodyContrast, accentContrast, inverseContrast }
}

export function evaluateAdvisory(advisory, template = 'editorial', brand = getBrandProfile('innvikta'), editor) {
  const issues = []
  if (!advisory.title?.trim()) issues.push(issue('title-empty', 'Add an advisory title.', 'error'))
  if (!advisory.intro?.trim()) issues.push(issue('intro-empty', 'Add a short introduction.', 'error'))
  if (!advisory.sectionOneTitle?.trim()) issues.push(issue('section-one-title-empty', 'Add the first section heading.', 'error'))
  if (!advisory.sectionTwoTitle?.trim()) issues.push(issue('section-two-title-empty', 'Add the second section heading.', 'error'))

  const allPoints = [...(advisory.sectionOnePoints || []).map((value, index) => ({ value, section: 1, index })), ...(advisory.sectionTwoPoints || []).map((value, index) => ({ value, section: 2, index }))]
  allPoints.forEach(({ value, section, index }) => { if (!value?.trim()) issues.push(issue(`point-${section}-${index}-empty`, `Section ${section}, point ${index + 1} is empty.`, 'error')) })
  if ((advisory.sectionOnePoints || []).length !== 4 || (advisory.sectionTwoPoints || []).length !== 4) issues.push(issue('point-count', 'Each advisory section must contain exactly four points.', 'error'))

  const fit = analyseTemplateFit(advisory, template)
  fit.overflows.forEach(overflow => issues.push(issue(overflow.id, `${overflow.label} Use Auto-fit or Tighten copy.`, 'error', 'fit')))

  const geometry = inspectVisualGeometry(template, editor)
  const brandAudit = inspectBrand(brand)
  issues.push(...geometry.issues, ...brandAudit.issues)

  const errors = issues.filter(item => item.severity === 'error').length
  const warnings = issues.length - errors
  const structuralScore = Math.max(0, 100 - (errors * 13) - (warnings * 5))
  const score = Math.min(structuralScore, fit.score)
  let status = 'Excellent'
  if (score < 90) status = 'Good'
  if (score < 75) status = 'Needs review'
  if (score < 55) status = 'Fix required'

  return {
    score,
    status,
    issues,
    canExport: errors === 0,
    fit,
    geometry,
    brandAudit,
    errorCount: errors,
    warningCount: warnings
  }
}
