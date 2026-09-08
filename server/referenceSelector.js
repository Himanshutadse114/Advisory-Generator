import { advisoryReferences } from '../src/data/references.js'

const CATEGORY_HINTS = [
  ['Phishing & Messaging', ['phishing', 'email', 'smishing', 'sms', 'whatsapp', 'attachment', 'qr', 'message']],
  ['Identity & Access', ['mfa', 'identity', 'login', 'password', 'authentication', 'account', 'credential']],
  ['Financial Fraud', ['fraud', 'payment', 'money', 'bank', 'tax', 'refund', 'contest', 'prize']],
  ['Malware & Device Security', ['malware', 'virus', 'device', 'mobile', 'usb', 'charging', 'app']],
  ['Social Engineering', ['vishing', 'pretexting', 'social engineering', 'impersonation', 'helpline', 'call']],
  ['Data & Privacy', ['privacy', 'data', 'cyberstalking', 'personal information']],
  ['Network Security', ['network', 'wifi', 'man in the middle', 'interception']],
  ['AI & Emerging Technology', ['ai', 'bot', 'deepfake', 'chatbot', 'generative ai']]
]

function words(value) {
  return String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

function inferCategory(topic) {
  const lower = String(topic || '').toLowerCase()
  let best = { category: 'Cybersecurity Awareness', score: 0 }
  for (const [category, hints] of CATEGORY_HINTS) {
    const score = hints.reduce((sum, hint) => sum + (lower.includes(hint) ? 4 : 0), 0)
    if (score > best.score) best = { category, score }
  }
  return best.category
}

function scoreReference(reference, topic, category) {
  const topicWords = new Set(words(topic))
  let score = reference.category === category ? 16 : 0
  const haystack = words([reference.title, ...(reference.keywords || [])].join(' '))
  for (const token of haystack) if (topicWords.has(token)) score += 3
  for (const keyword of reference.keywords || []) {
    if (String(topic).toLowerCase().includes(String(keyword).toLowerCase())) score += 8
  }
  return score
}

export function selectReference({ topic, referenceId }) {
  if (referenceId && referenceId !== 'auto') {
    const selected = advisoryReferences.find(item => item.id === referenceId)
    if (selected) return selected
  }

  const category = inferCategory(topic)
  return advisoryReferences
    .map(reference => ({ ...reference, score: scoreReference(reference, topic, category) }))
    .sort((a, b) => b.score - a.score)[0] || advisoryReferences[0]
}
