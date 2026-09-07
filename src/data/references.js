const REPO_RAW = 'https://raw.githubusercontent.com/Himanshutadse114/Advisory-Generator/main/'

const references = [
  ['Identity theft.webp', 'Identity & Access', 'identity-protection', 'split', 'medium', 'left', ['identity', 'account', 'personal data', 'impersonation']],
  ['Pretexting-2.webp', 'Social Engineering', 'human-manipulation', 'split', 'medium', 'left', ['pretexting', 'impersonation', 'trust', 'social engineering']],
  ['contest scam trap.webp', 'Financial Fraud', 'fraud-alert', 'flow', 'medium', 'right', ['contest', 'prize', 'reward', 'scam', 'fraud']],
  ['cyberstalking.webp', 'Data & Privacy', 'privacy-risk', 'editorial', 'medium', 'right', ['cyberstalking', 'privacy', 'personal information', 'online safety']],
  ['email security.webp', 'Phishing & Messaging', 'message-threat', 'editorial', 'medium', 'right', ['email', 'phishing', 'sender', 'attachment', 'link']],
  ['fake applications fraud.webp', 'Financial Fraud', 'fraud-alert', 'flow', 'medium', 'right', ['fake app', 'application', 'fraud', 'mobile', 'payment']],
  ['fake helpline scam.webp', 'Social Engineering', 'human-manipulation', 'split', 'medium', 'left', ['helpline', 'support', 'impersonation', 'call', 'scam']],
  ['juice jacking.webp', 'Malware & Device Security', 'device-security', 'editorial', 'light', 'right', ['juice jacking', 'charging', 'usb', 'mobile', 'device']],
  ['maliciouis attachment.webp', 'Phishing & Messaging', 'message-threat', 'flow', 'medium', 'right', ['attachment', 'email', 'malware', 'phishing']],
  ['malware.webp', 'Malware & Device Security', 'device-security', 'editorial', 'medium', 'right', ['malware', 'virus', 'device', 'software']],
  ['man in the middle attack.webp', 'Network Security', 'network-threat', 'flow', 'dense', 'centre', ['man in the middle', 'network', 'wifi', 'interception']],
  ['mfa.webp', 'Identity & Access', 'identity-protection', 'split', 'light', 'left', ['mfa', 'authentication', 'login', 'account']],
  ['mobile payment fraud.webp', 'Financial Fraud', 'fraud-alert', 'flow', 'medium', 'right', ['mobile payment', 'banking', 'fraud', 'money']],
  ['mobile security.webp', 'Malware & Device Security', 'device-security', 'editorial', 'medium', 'right', ['mobile', 'device', 'security', 'app']],
  ['phishing scams.webp', 'Phishing & Messaging', 'message-threat', 'flow', 'medium', 'right', ['phishing', 'email', 'link', 'credentials']],
  ['pretexting.webp', 'Social Engineering', 'human-manipulation', 'split', 'medium', 'left', ['pretexting', 'story', 'trust', 'impersonation']],
  ['quid pro quo.webp', 'Social Engineering', 'human-manipulation', 'split', 'medium', 'left', ['quid pro quo', 'offer', 'exchange', 'social engineering']],
  ['safe usage of bots.webp', 'AI & Emerging Technology', 'ai-safety', 'editorial', 'medium', 'right', ['bot', 'ai', 'chatbot', 'data', 'safe use']],
  ['sms-whatsapp scam.webp', 'Phishing & Messaging', 'message-threat', 'flow', 'medium', 'right', ['sms', 'whatsapp', 'smishing', 'message', 'scam']],
  ['social engineering tricks.webp', 'Social Engineering', 'human-manipulation', 'split', 'dense', 'left', ['social engineering', 'tricks', 'manipulation', 'trust']],
  ['social engineering-smishing.webp', 'Phishing & Messaging', 'message-threat', 'flow', 'medium', 'right', ['smishing', 'sms', 'social engineering', 'message']],
  ['social engineering.webp', 'Social Engineering', 'human-manipulation', 'split', 'medium', 'left', ['social engineering', 'impersonation', 'trust', 'urgency']],
  ['tax fraud.webp', 'Financial Fraud', 'fraud-alert', 'flow', 'medium', 'right', ['tax', 'refund', 'payment', 'fraud']],
  ['virus protection.webp', 'Malware & Device Security', 'device-security', 'editorial', 'light', 'right', ['virus', 'antivirus', 'malware', 'device']],
  ['vishing.webp', 'Social Engineering', 'voice-scam', 'split', 'medium', 'left', ['vishing', 'voice', 'phone', 'call', 'impersonation']]
]

const prettyName = file => file
  .replace(/\.webp$/i, '')
  .replace(/-2$/i, '')
  .replace(/\b\w/g, character => character.toUpperCase())

export const advisoryReferences = references.map((entry, index) => {
  const [file, category, visualFamily, suggestedTemplate, density, illustrationPosition, keywords] = entry
  return {
    id: `reference-${index + 1}`,
    file,
    title: prettyName(file),
    url: `${REPO_RAW}${file.split('/').map(encodeURIComponent).join('/')}`,
    category,
    visualFamily,
    suggestedTemplate,
    density,
    illustrationPosition,
    keywords,
    sectionStructure: 'intro + explanation + best-practices',
    source: 'approved-reference-library'
  }
})

export const REFERENCE_CATEGORIES = [...new Set(advisoryReferences.map(item => item.category))]
