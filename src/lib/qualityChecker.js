import { analyseTemplateFit } from './designIntelligence'

function issue(id, label, severity = 'warning') {
  return { id, label, severity }
}

export function evaluateAdvisory(advisory, template = 'editorial') {
  const issues = []

  if (!advisory.title?.trim()) {
    issues.push(issue('title-empty', 'Add an advisory title.', 'error'))
  }

  if (!advisory.intro?.trim()) {
    issues.push(issue('intro-empty', 'Add a short introduction.', 'error'))
  }

  if (!advisory.sectionOneTitle?.trim()) {
    issues.push(issue('section-one-title-empty', 'Add the first section heading.', 'error'))
  }

  if (!advisory.sectionTwoTitle?.trim()) {
    issues.push(issue('section-two-title-empty', 'Add the second section heading.', 'error'))
  }

  const allPoints = [
    ...(advisory.sectionOnePoints || []).map((value, index) => ({ value, section: 1, index })),
    ...(advisory.sectionTwoPoints || []).map((value, index) => ({ value, section: 2, index }))
  ]

  allPoints.forEach(({ value, section, index }) => {
    if (!value?.trim()) {
      issues.push(issue(`point-${section}-${index}-empty`, `Section ${section}, point ${index + 1} is empty.`, 'error'))
    }
  })

  if ((advisory.sectionOnePoints || []).length !== 4 || (advisory.sectionTwoPoints || []).length !== 4) {
    issues.push(issue('point-count', 'Each advisory section must contain exactly four points.', 'error'))
  }

  const fit = analyseTemplateFit(advisory, template)
  fit.overflows.forEach(overflow => {
    issues.push(issue(
      overflow.id,
      `${overflow.label} Use Auto-fit Layout or shorten the copy.`,
      'error'
    ))
  })

  const errors = issues.filter(item => item.severity === 'error').length
  const warnings = issues.length - errors
  const structuralScore = Math.max(0, 100 - (errors * 18) - (warnings * 7))
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
    fit
  }
}
