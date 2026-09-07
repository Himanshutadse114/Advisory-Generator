import { advisoryReferences } from '../data/references'

const normalise = value => String(value || '').toLowerCase()

function tokenise(value) {
  return normalise(value)
    .replace(/[^a-z0-9& ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function overlapScore(topicTokens, values) {
  const haystack = new Set(tokenise(values.join(' ')))
  return topicTokens.reduce((score, token) => score + (haystack.has(token) ? 5 : 0), 0)
}

export function rankReferences(advisory, limit = 5) {
  const topicTokens = tokenise(`${advisory.topic} ${advisory.title} ${advisory.category}`)

  return advisoryReferences
    .map(reference => {
      let score = 0
      if (normalise(reference.category) === normalise(advisory.category)) score += 28
      if (normalise(advisory.category).includes(normalise(reference.category).split(' ')[0])) score += 8
      score += overlapScore(topicTokens, [reference.title, ...reference.keywords])
      if (reference.density === 'medium') score += 2

      return {
        ...reference,
        relevanceScore: score
      }
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore || a.title.localeCompare(b.title))
    .slice(0, limit)
}

export function getReferenceDirection(advisory) {
  const ranked = rankReferences(advisory, 3)
  if (!ranked.length) {
    return {
      template: null,
      visualFamily: 'general-security',
      illustrationPosition: 'right',
      references: []
    }
  }

  const weighted = key => {
    const counts = new Map()
    ranked.forEach((reference, index) => {
      const weight = Math.max(1, 3 - index)
      counts.set(reference[key], (counts.get(reference[key]) || 0) + weight)
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  }

  return {
    template: weighted('suggestedTemplate'),
    visualFamily: weighted('visualFamily'),
    illustrationPosition: weighted('illustrationPosition'),
    references: ranked
  }
}

export function getReferenceAwareTemplate(advisory, fallbackTemplate = 'editorial') {
  return getReferenceDirection(advisory).template || fallbackTemplate
}
