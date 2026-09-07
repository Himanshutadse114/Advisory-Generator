const LIMITS = {
  editorial: {
    title: 62,
    intro: 255,
    bullet: 145
  },
  split: {
    title: 52,
    intro: 300,
    bullet: 155
  },
  flow: {
    title: 60,
    intro: 245,
    bullet: 125
  }
}

function issue(id, label, severity = 'warning') {
  return { id, label, severity }
}

export function evaluateAdvisory(advisory, template = 'editorial') {
  const limits = LIMITS[template] || LIMITS.editorial
  const issues = []

  if (!advisory.title?.trim()) {
    issues.push(issue('title-empty', 'Add an advisory title.', 'error'))
  } else if (advisory.title.length > limits.title) {
    issues.push(issue('title-long', `Shorten the title to about ${limits.title} characters for this layout.`))
  }

  if (!advisory.intro?.trim()) {
    issues.push(issue('intro-empty', 'Add a short introduction.', 'error'))
  } else if (advisory.intro.length > limits.intro) {
    issues.push(issue('intro-long', 'The introduction is dense for the selected layout. Shorten it or switch templates.'))
  }

  const allPoints = [
    ...(advisory.sectionOnePoints || []).map((value, index) => ({ value, section: 1, index })),
    ...(advisory.sectionTwoPoints || []).map((value, index) => ({ value, section: 2, index }))
  ]

  allPoints.forEach(({ value, section, index }) => {
    if (!value?.trim()) {
      issues.push(issue(`point-${section}-${index}-empty`, `Section ${section}, point ${index + 1} is empty.`, 'error'))
    } else if (value.length > limits.bullet) {
      issues.push(issue(`point-${section}-${index}-long`, `Section ${section}, point ${index + 1} is too long for comfortable reading.`))
    }
  })

  if ((advisory.sectionOneTitle || '').length > 30 || (advisory.sectionTwoTitle || '').length > 30) {
    issues.push(issue('section-heading-long', 'Keep section headings short so the hierarchy stays clear.'))
  }

  const errors = issues.filter(item => item.severity === 'error').length
  const warnings = issues.length - errors
  const score = Math.max(0, 100 - (errors * 18) - (warnings * 7))

  let status = 'Excellent'
  if (score < 90) status = 'Good'
  if (score < 75) status = 'Needs review'
  if (score < 55) status = 'Fix required'

  return {
    score,
    status,
    issues,
    canExport: errors === 0
  }
}
